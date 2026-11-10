<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

$user = klik_require_user();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

try {
    if ($method === 'GET') {
        $orders = [];
        foreach (klik_read_json('orders') as $order) {
            if ((int) ($order['user_id'] ?? 0) === (int) $user['id']) {
                $orders[] = $order;
            }
        }

        usort($orders, static function (array $a, array $b): int {
            return strcmp((string) ($b['date'] ?? ''), (string) ($a['date'] ?? ''));
        });

        klik_json_response([
            'ok' => true,
            'orders' => array_map('klik_public_order', $orders),
        ]);
    }

    if ($method === 'POST') {
        $data = klik_request_json();
        $items = $data['items'] ?? [];

        if (!is_array($items) || count($items) === 0) {
            klik_json_response(['ok' => false, 'error' => 'Keranjang masih kosong.'], 422);
        }

        $products = [];
        foreach (klik_products() as $product) {
            $products[(string) ($product['id'] ?? '')] = $product;
        }

        $maxQty = klik_setting('maxQty', 99);
        $normalized = klik_normalize_order_items($items, $products, $maxQty);
        if (($normalized['ok'] ?? false) !== true) {
            klik_json_response([
                'ok' => false,
                'error' => (string) ($normalized['error'] ?? 'Ada produk yang tidak valid di pesanan.'),
            ], 422);
        }

        $normalizedItems = $normalized['items'];
        $subtotal = (int) $normalized['subtotal'];
        $originalTotal = (int) $normalized['originalTotal'];

        $delivery = (string) ($data['delivery'] ?? 'express');
        if (!in_array($delivery, ['express', 'pickup'], true)) {
            $delivery = 'express';
        }

        // Seluruh validasi voucher/poin dan perubahan data berjalan dalam satu
        // lock. Validasi dilakukan di sini agar selalu membaca order dan poin
        // terbaru dari disk, bukan snapshot sebelum lock.
        $result = klik_with_lock('checkout', static function () use ($data, $user, $normalizedItems, $subtotal, $originalTotal, $delivery): array {
            $userId = (int) $user['id'];

            $shippingFee = $delivery === 'express' ? klik_setting('shippingExpress', 10000) : 0;
            $voucherCode = strtoupper(trim((string) ($data['voucher'] ?? '')));
            $voucherDiscount = 0;
            $voucherLabel = '';

            if ($voucherCode !== '') {
                $voucher = klik_voucher($voucherCode);
                if ($voucher === null) {
                    return ['status' => 422, 'payload' => ['ok' => false, 'error' => 'Voucher tidak dikenal.']];
                }

                if (!in_array($voucherCode, klik_claimed_codes($userId), true)) {
                    return ['status' => 422, 'payload' => ['ok' => false, 'error' => 'Klaim voucher ini dulu sebelum dipakai.']];
                }

                if (klik_voucher_used($userId, $voucherCode)) {
                    return ['status' => 422, 'payload' => ['ok' => false, 'error' => 'Voucher ini sudah pernah kamu pakai.']];
                }

                $minimum = (int) ($voucher['min'] ?? 0);
                if ($subtotal < $minimum) {
                    return ['status' => 422, 'payload' => ['ok' => false, 'error' => 'Minimum belanja voucher belum terpenuhi.']];
                }

                if (!empty($voucher['expressOnly']) && $delivery !== 'express') {
                    return ['status' => 422, 'payload' => ['ok' => false, 'error' => 'Voucher ini hanya untuk pesanan antar.']];
                }

                $voucherDiscount = klik_voucher_discount($voucher, $subtotal, $shippingFee);
                $voucherLabel = $voucherDiscount > 0
                    ? (string) ($voucher['label'] ?? $voucher['title'] ?? 'Diskon Voucher')
                    : '';
            }

            $usePoints = !empty($data['usePoints']);
            $account = klik_find_user_by_id($userId);
            $pointsBalance = (int) ($account['points'] ?? ($user['points'] ?? 0));
            $pointCost = klik_setting('pointCost', 2000);
            $pointValue = klik_setting('pointValue', 2000);

            // Jangan diam-diam menagih lebih tinggi dari total yang dilihat pembeli:
            // kalau poin tidak cukup, tolak dan minta klien menyegarkan saldo poin.
            if ($usePoints && $pointsBalance < $pointCost) {
                return ['status' => 422, 'payload' => [
                    'ok' => false,
                    'error' => 'Poin kamu tidak cukup untuk penukaran.',
                    'points' => $pointsBalance,
                ]];
            }

            $pointsUsed = $usePoints ? $pointCost : 0;
            $pointsDiscount = $pointsUsed > 0 ? $pointValue : 0;

            $total = max(0, $subtotal + $shippingFee - $voucherDiscount - $pointsDiscount);
            $saving = max(0, $originalTotal - $subtotal) + $voucherDiscount + $pointsDiscount;

            $methodLabel = (string) ($data['method'] ?? 'QRIS');
            if (!in_array($methodLabel, ['QRIS', 'Transfer Bank', 'Bayar di Tempat'], true)) {
                $methodLabel = 'QRIS';
            }

            $order = [
                'id' => 'INV-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3))),
                'user_id' => $userId,
                'date' => date(DATE_ATOM),
                'items' => $normalizedItems,
                'subtotal' => $subtotal,
                'originalTotal' => $originalTotal,
                'promoDiscount' => max(0, $originalTotal - $subtotal),
                'shippingFee' => $shippingFee,
                'voucher' => $voucherCode !== '' ? $voucherCode : null,
                'voucherDiscount' => $voucherDiscount,
                'voucherLabel' => $voucherLabel,
                'pointsUsed' => $pointsUsed,
                'pointsDiscount' => $pointsDiscount,
                'total' => $total,
                'saving' => $saving,
                'method' => $methodLabel,
                'delivery' => $delivery,
                'eta' => $delivery === 'express' ? '45 menit' : '30 menit',
                'status' => 'Diproses',
                'address' => $data['address'] ?? null,
                'store' => $data['store'] ?? null,
            ];

            // Menulis order dengan kode voucher sekaligus menandainya terpakai;
            // klik_used_codes membaca voucher dari riwayat order.
            klik_update_json('orders', static function (array $orders) use ($order): array {
                $orders[] = $order;
                return $orders;
            }, []);

            klik_update_json('users', static function (array $users) use ($userId, $pointsUsed, $order): array {
                foreach ($users as &$item) {
                    if ((int) ($item['id'] ?? 0) === $userId) {
                        $points = (int) ($item['points'] ?? 0);
                        if ($pointsUsed > 0) {
                            $points = max(0, $points - $pointsUsed);
                        }
                        $item['points'] = $points + (int) floor(((int) $order['total']) / 1000);
                        break;
                    }
                }
                unset($item);

                return $users;
            }, []);

            $freshUser = klik_find_user_by_id($userId);

            return ['status' => 201, 'payload' => [
                'ok' => true,
                'order' => klik_public_order($order),
                'user' => klik_public_user($freshUser ?? $user),
                'claimed' => klik_claimed_codes($userId),
                'used' => klik_used_codes($userId),
            ]];
        });

        klik_json_response($result['payload'], (int) $result['status']);
    }

    klik_json_response(['ok' => false, 'error' => 'Metode tidak diizinkan.'], 405);
} catch (Throwable $error) {
    error_log('[Klik orders] ' . $error->getMessage());
    klik_json_response(['ok' => false, 'error' => 'Pesanan gagal diproses.'], 500);
}
