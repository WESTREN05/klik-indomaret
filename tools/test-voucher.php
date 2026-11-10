<?php
declare(strict_types=1);

/**
 * test-voucher.php — kasus uji aturan voucher sekali pakai di php/lib/auth.php.
 *
 * Jalankan dari root proyek:
 *   php tools/test-voucher.php
 *
 * Data dibaca lewat stub klik_read_json(), jadi file php/data asli tidak
 * tersentuh oleh pengujian.
 */

$GLOBALS['__fixtures'] = [];

/** Stub pembaca data: mengembalikan fixture, bukan isi php/data. */
function klik_read_json(string $name, array $default = []): array
{
    return $GLOBALS['__fixtures'][$name] ?? $default;
}

require_once dirname(__DIR__) . '/php/lib/auth.php';

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

function fixtures(array $orders): void
{
    $GLOBALS['__fixtures'] = ['orders' => $orders];
}

/* ---- klik_used_codes ---- */

check('klik_used_codes hanya mengambil voucher milik user terkait', function (): void {
    fixtures([
        ['user_id' => 1, 'voucher' => 'SABTUMERIAH'],
        ['user_id' => 1, 'voucher' => 'NEWMEMBER'],
        ['user_id' => 2, 'voucher' => 'GAJIANHEMAT'],
    ]);

    expect_same(['SABTUMERIAH', 'NEWMEMBER'], klik_used_codes(1), 'Voucher user 1');
    expect_same(['GAJIANHEMAT'], klik_used_codes(2), 'Voucher user 2');
});

check('klik_used_codes tidak menggandakan voucher yang dipakai berkali-kali', function (): void {
    fixtures([
        ['user_id' => 1, 'voucher' => 'SABTUMERIAH'],
        ['user_id' => 1, 'voucher' => 'SABTUMERIAH'],
    ]);

    expect_same(['SABTUMERIAH'], klik_used_codes(1), 'Voucher unik');
});

check('klik_used_codes mengabaikan voucher kosong dan pesanan tanpa voucher', function (): void {
    fixtures([
        ['user_id' => 1, 'voucher' => null],
        ['user_id' => 1],
        ['user_id' => 1, 'voucher' => ''],
        ['user_id' => 1, 'voucher' => 'NEWMEMBER'],
    ]);

    expect_same(['NEWMEMBER'], klik_used_codes(1), 'Hanya kode valid');
});

check('klik_used_codes kosong bila user belum punya pesanan', function (): void {
    fixtures([]);

    expect_same([], klik_used_codes(1), 'Daftar kosong');
});

/* ---- klik_voucher_used ---- */

check('klik_voucher_used menolak voucher yang sudah dipakai', function (): void {
    fixtures([['user_id' => 1, 'voucher' => 'SABTUMERIAH']]);

    expect_same(true, klik_voucher_used(1, 'SABTUMERIAH'), 'Voucher terpakai');
    expect_same(true, klik_voucher_used(1, '  sabtumeriah  '), 'Kode dinormalisasi');
    expect_same(false, klik_voucher_used(1, 'NEWMEMBER'), 'Voucher lain tetap bisa');
});

check('klik_voucher_used hanya berlaku untuk akun pemakai', function (): void {
    fixtures([['user_id' => 1, 'voucher' => 'SABTUMERIAH']]);

    expect_same(false, klik_voucher_used(2, 'SABTUMERIAH'), 'Akun lain tidak terpengaruh');
});

check('klik_voucher_used false bila riwayat pesanan kosong', function (): void {
    fixtures([]);

    expect_same(false, klik_voucher_used(1, 'SABTUMERIAH'), 'Belum pernah dipakai');
});

echo "\n";
if ($passed !== $total) {
    echo "{$passed}/{$total} kasus lulus.\n";
    exit(1);
}

echo "OK {$passed}/{$total} kasus lulus.\n";
