<?php
declare(strict_types=1);

/**
 * Reset data demo: akun demo dibuat ulang, pesanan dan klaim voucher dikosongkan.
 * Katalog produk (catalog.json) tidak disentuh.
 *
 * Jalankan dari terminal dengan server PHP dimatikan:
 *   php tools/reset-demo.php
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    exit("Script ini hanya bisa dijalankan dari terminal.\n");
}

$dataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) {
    fwrite(STDERR, "Folder php/data tidak ditemukan.\n");
    exit(1);
}

$now = date(DATE_ATOM);
$data = [
    'users' => [[
        'id' => 1,
        'name' => 'Bagas Pratama',
        'phone' => '081234567890',
        'email' => 'bagas@email.com',
        'password_hash' => password_hash('password123', PASSWORD_DEFAULT),
        'joined' => $now,
        'saldo' => 185000,
        'points' => 4850,
        'created_at' => $now,
    ]],
    'orders' => [],
    'voucher_claims' => [],
];

echo "Mereset data demo...\n";

foreach ($data as $name => $value) {
    $path = $dataDir . DIRECTORY_SEPARATOR . $name . '.json';
    $json = json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        fwrite(STDERR, "Gagal mengubah data {$name} menjadi JSON.\n");
        exit(1);
    }

    $tmp = $path . '.tmp.' . getmypid();
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        fwrite(STDERR, "Gagal menulis file sementara untuk {$name}. Hentikan server PHP lalu coba lagi.\n");
        exit(1);
    }

    // rename() di Windows tidak selalu menimpa file tujuan yang sudah ada.
    if (is_file($path) && !unlink($path)) {
        @unlink($tmp);
        fwrite(STDERR, "Gagal mengganti {$name}.json. Hentikan server PHP lalu coba lagi.\n");
        exit(1);
    }
    if (!rename($tmp, $path)) {
        @unlink($tmp);
        fwrite(STDERR, "Gagal menyimpan {$name}.json.\n");
        exit(1);
    }

    echo "  OK  php/data/{$name}.json\n";
}

echo "\nSelesai. Akun demo: 081234567890 / password123\n";
echo "Katalog produk tidak diubah. Hapus localStorage browser jika ingin keranjang ikut bersih.\n";
