<?php
declare(strict_types=1);

/**
 * Bentuk order yang aman dikirim ke frontend.
 */
function klik_public_order(array $order): array
{
    unset($order['user_id']);
    return $order;
}

/**
 * Gabungkan baris keranjang dengan id + varian yang sama, lalu validasi
 * qty gabungan terhadap maxQty. Dipakai server agar batas qty tidak bisa
 * dilewati dengan memecah item menjadi beberapa baris.
 *
 * @return array{ok: bool, error?: string, items?: array, subtotal?: int, originalTotal?: int}
 */
function klik_normalize_order_items(array $items, array $products, int $maxQty): array
{
    $merged = [];

    foreach ($items as $item) {
        if (!is_array($item)) {
            return ['ok' => false, 'error' => 'Item pesanan tidak valid.'];
        }

        $id = (string) ($item['id'] ?? '');
        $qty = (int) ($item['qty'] ?? 0);

        if (!isset($products[$id]) || $qty < 1) {
            return ['ok' => false, 'error' => 'Ada produk yang tidak valid di pesanan.'];
        }

        $product = $products[$id];

        $variant = trim((string) ($item['variant'] ?? ''));
        if ($variant === '') {
            $variant = (string) ($product['unit'] ?? '');
        }

        $variants = array_map(static fn($value): string => (string) $value, (array) ($product['variants'] ?? []));
        if ($variants === []) {
            $variants = [(string) ($product['unit'] ?? '')];
        }

        if (!in_array($variant, $variants, true)) {
            return ['ok' => false, 'error' => 'Ada varian produk yang tidak valid di pesanan.'];
        }

        $key = $id . "\x1f" . $variant;
        if (!isset($merged[$key])) {
            $price = (int) ($product['price'] ?? 0);
            $merged[$key] = [
                'id' => $id,
                'name' => (string) ($product['short'] ?? $product['name'] ?? $id),
                'qty' => 0,
                'variant' => $variant,
                'price' => $price,
                'emoji' => (string) ($product['emoji'] ?? '🛒'),
                'tint' => (string) ($product['tint'] ?? '#eef2f8'),
                'original' => (int) ($product['original'] ?? $price),
            ];
        }

        $merged[$key]['qty'] += $qty;
    }

    $normalizedItems = [];
    $subtotal = 0;
    $originalTotal = 0;

    foreach ($merged as $entry) {
        if ($entry['qty'] > $maxQty) {
            return ['ok' => false, 'error' => 'Ada produk yang tidak valid di pesanan.'];
        }

        $subtotal += $entry['price'] * $entry['qty'];
        $originalTotal += $entry['original'] * $entry['qty'];

        unset($entry['original']);
        $normalizedItems[] = $entry;
    }

    return [
        'ok' => true,
        'items' => $normalizedItems,
        'subtotal' => $subtotal,
        'originalTotal' => $originalTotal,
    ];
}
