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

        $subtotal = 0;
        $originalTotal = 0;
        $normalizedItems = [];

        foreach ($items as $item) {
            if (!is_array($item)) {
                klik_json_response(['ok' => false, 'error' => 'Item pesanan tidak valid.'], 422);
            }

            $id = (string) ($item['id'] ?? '');
            $qty = (int) ($item['qty'] ?? 0);

            if (!isset($products[$id]) || $qty < 1 || $qty > 99) {
                klik_json_response(['ok' => false, 'error' => 'Ada produk yang tidak valid di pesanan.'], 422);
            }

            $product = $products[$id];
            $price = (int) ($product['price'] ?? 0);
            $original = (int) ($product['original'] ?? $price);

            $subtotal += $price * $qty;
            $originalTotal += $original * $qty;
            $normalizedItems[] = [
                'id' => $id,
                'name' => (string) ($product['short'] ?? $product['name'] ?? $id),
                'qty' => $qty,
                'variant' => (string) ($item['variant'] ?? ($product['unit'] ?? '')),
                'price' => $price,
                'emoji' => (string) ($product['emoji'] ?? '🛒'),
                'tint' => (string) ($product['tint'] ?? '#eef2f8'),
            ];
        }

        $delivery = (string) ($data['delivery'] ?? 'express');
        if (!in_array($delivery, ['express', 'pickup'], true)) {
            $delivery = 'express';
        }

        $shippingFee = $delivery === 'express' ? 10000 : 0;
        $voucherCode = strtoupper(trim((string) ($data['voucher'] ?? '')));
        $voucherDiscount = 0;
        $voucherLabel = '';

        if ($voucherCode !== '') {
            $voucher = klik_voucher($voucherCode);
            if ($voucher === null) {
                klik_json_response(['ok' => false, 'error' => 'Voucher tidak dikenal.'], 422);
            }

            if (!in_array($voucherCode, klik_claimed_codes((int) $user['id']), true)) {
                klik_json_response(['ok' => false, 'error' => 'Klaim voucher ini dulu sebelum dipakai.'], 422);
            }

            $minimum = (int) ($voucher['min'] ?? 0);
            if ($subtotal < $minimum) {
                klik_json_response(['ok' => false, 'error' => 'Minimum belanja voucher belum terpenuhi.'], 422);
            }

            if ($voucherCode === 'GRATISONGKIR') {
                if ($delivery !== 'express') {
                    klik_json_response(['ok' => false, 'error' => 'Voucher ongkir hanya untuk pesanan antar.'], 422);
                }
                $voucherDiscount = min(10000, $shippingFee);
                $voucherLabel = 'Diskon Voucher Pengiriman';
            } elseif ($voucherCode === 'GAJIANHEMAT') {
                $voucherDiscount = min(40000, (int) round($subtotal * 0.4));
                $voucherLabel = 'Diskon Voucher Gajian';
            } elseif ($voucherCode === 'NEWMEMBER') {
                $voucherDiscount = 15000;
                $voucherLabel = 'Diskon Voucher Member';
            } elseif ($voucherCode === 'SABTUMERIAH') {
                if ($delivery !== 'express') {
                    klik_json_response(['ok' => false, 'error' => 'Voucher Sabtu Meriah hanya untuk pesanan antar.'], 422);
                }
                $voucherDiscount = min(30000, (int) round($subtotal * 0.3)) + min(10000, $shippingFee);
                $voucherLabel = 'Diskon Voucher Sabtu Meriah';
            }
        }

        $usePoints = !empty($data['usePoints']);
        $pointsBalance = (int) ($user['points'] ?? 0);
        $pointsUsed = $usePoints && $pointsBalance >= 2000 ? 2000 : 0;
        $pointsDiscount = $pointsUsed > 0 ? 2000 : 0;

        $total = max(0, $subtotal + $shippingFee - $voucherDiscount - $pointsDiscount);
        $saving = max(0, $originalTotal - $subtotal) + $voucherDiscount + $pointsDiscount;

        $methodLabel = (string) ($data['method'] ?? 'QRIS');
        if (!in_array($methodLabel, ['QRIS', 'Transfer Bank', 'Bayar di Tempat'], true)) {
            $methodLabel = 'QRIS';
        }

        $order = [
            'id' => 'INV-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3))),
            'user_id' => (int) $user['id'],
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

        klik_update_json('orders', static function (array $orders) use ($order): array {
            $orders[] = $order;
            return $orders;
        }, []);

        klik_update_json('users', static function (array $users) use ($user, $pointsUsed, $total): array {
            foreach ($users as &$item) {
                if ((int) ($item['id'] ?? 0) === (int) $user['id']) {
                    $points = (int) ($item['points'] ?? 0);
                    if ($pointsUsed > 0) {
                        $points = max(0, $points - $pointsUsed);
                    }
                    $item['points'] = $points + (int) floor($total / 1000);
                    break;
                }
            }
            unset($item);

            return $users;
        }, []);

        $freshUser = klik_find_user_by_id((int) $user['id']);

        klik_json_response([
            'ok' => true,
            'order' => klik_public_order($order),
            'user' => klik_public_user($freshUser ?? $user),
        ], 201);
    }

    klik_json_response(['ok' => false, 'error' => 'Metode tidak diizinkan.'], 405);
} catch (Throwable $error) {
    error_log('[Klik orders] ' . $error->getMessage());
    klik_json_response(['ok' => false, 'error' => 'Pesanan gagal diproses.'], 500);
}
