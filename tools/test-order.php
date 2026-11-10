<?php
declare(strict_types=1);

/**
 * test-order.php — kasus uji penggabungan item pesanan di php/lib/order.php.
 *
 * Jalankan dari root proyek:
 *   php tools/test-order.php
 */

require_once dirname(__DIR__) . '/php/lib/order.php';

$total = 0;
$passed = 0;

function check(string $name, callable $fn): void
{
    global $total, $passed;
    $total++;

    try {
        $fn();
        $passed++;
        echo "LULUS  {$name}\n";
    } catch (Throwable $error) {
        echo "GAGAL  {$name}\n";
        echo '       ' . $error->getMessage() . "\n";
    }
}

function expect_same(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(
            $message . ' — diharapkan ' . var_export($expected, true) . ', dapat ' . var_export($actual, true)
        );
    }
}

$products = [
    'sania-2l' => [
        'id' => 'sania-2l',
        'short' => 'Sania Minyak Goreng',
        'price' => 34200,
        'original' => 38900,
        'unit' => 'Pouch 2L',
        'variants' => ['Pouch 2L', 'Botol 2L'],
        'emoji' => '🛢️',
        'tint' => '#eef2f8',
    ],
    'ultra-1l' => [
        'id' => 'ultra-1l',
        'short' => 'Ultra Milk',
        'price' => 18900,
        'original' => 22500,
        'unit' => '1000ml',
        'variants' => ['1000ml', '250ml'],
        'emoji' => '🥛',
        'tint' => '#f4f8ff',
    ],
];

check('baris dengan id + varian sama digabung dan qty dijumlahkan', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 2],
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 3],
    ], $products, 99);

    expect_same(true, $result['ok'], 'Status');
    expect_same(1, count($result['items']), 'Jumlah baris gabungan');
    expect_same(5, $result['items'][0]['qty'], 'Qty gabungan');
    expect_same(34200 * 5, $result['subtotal'], 'Subtotal gabungan');
    expect_same(38900 * 5, $result['originalTotal'], 'Total harga asli gabungan');
});

check('id sama dengan varian berbeda tetap menjadi baris terpisah', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 1],
        ['id' => 'sania-2l', 'variant' => 'Botol 2L', 'qty' => 2],
    ], $products, 99);

    expect_same(true, $result['ok'], 'Status');
    expect_same(2, count($result['items']), 'Jumlah baris');
    expect_same(34200 * 3, $result['subtotal'], 'Subtotal dua varian');
});

check('varian kosong memakai unit produk lalu digabung', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'ultra-1l', 'qty' => 1],
        ['id' => 'ultra-1l', 'variant' => '1000ml', 'qty' => 2],
    ], $products, 99);

    expect_same(true, $result['ok'], 'Status');
    expect_same(1, count($result['items']), 'Jumlah baris');
    expect_same('1000ml', $result['items'][0]['variant'], 'Varian default');
    expect_same(3, $result['items'][0]['qty'], 'Qty gabungan');
});

check('qty gabungan melebihi maxQty ditolak', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 60],
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 40],
    ], $products, 99);

    expect_same(false, $result['ok'], 'Status');
    expect_same('Ada produk yang tidak valid di pesanan.', $result['error'], 'Pesan error');
});

check('qty satu baris melebihi maxQty ditolak', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 100],
    ], $products, 99);

    expect_same(false, $result['ok'], 'Status');
});

check('qty kurang dari 1 ditolak', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 0],
    ], $products, 99);

    expect_same(false, $result['ok'], 'Status');
});

check('produk tidak dikenal ditolak', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'tidak-ada', 'variant' => 'Pouch 2L', 'qty' => 1],
    ], $products, 99);

    expect_same(false, $result['ok'], 'Status');
});

check('varian tidak dikenal ditolak', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Galon', 'qty' => 1],
    ], $products, 99);

    expect_same(false, $result['ok'], 'Status');
});

check('item bukan array ditolak', function () use ($products): void {
    $result = klik_normalize_order_items(['bukan-array'], $products, 99);

    expect_same(false, $result['ok'], 'Status');
});

check('field internal original tidak ikut ke item pesanan', function () use ($products): void {
    $result = klik_normalize_order_items([
        ['id' => 'sania-2l', 'variant' => 'Pouch 2L', 'qty' => 1],
    ], $products, 99);

    expect_same(true, $result['ok'], 'Status');
    expect_same(false, array_key_exists('original', $result['items'][0]), 'Field original');
    expect_same('Sania Minyak Goreng', $result['items'][0]['name'], 'Nama produk');
    expect_same(34200, $result['items'][0]['price'], 'Harga produk');
});

echo "\n";
if ($passed !== $total) {
    echo "{$passed}/{$total} kasus lulus.\n";
    exit(1);
}

echo "OK {$passed}/{$total} kasus lulus.\n";
