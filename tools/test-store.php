<?php
declare(strict_types=1);

/**
 * test-store.php — kasus uji helper lock dan update JSON di php/lib/store.php.
 *
 * Jalankan dari root proyek:
 *   php tools/test-store.php
 *
 * Lock file dan file data uji dibuat di php/data lalu dihapus lagi.
 */

require_once dirname(__DIR__) . '/php/lib/store.php';

$mode = $argv[1] ?? '';

if ($mode === '--hold') {
    klik_with_lock('test-store-cross', static function () use ($argv): void {
        file_put_contents($argv[2], (string) microtime(true), LOCK_EX);
        usleep(400000);
        file_put_contents($argv[3], (string) microtime(true), LOCK_EX);
    });
    exit(0);
}

if ($mode === '--wait') {
    klik_with_lock('test-store-cross', static function () use ($argv): void {
        file_put_contents($argv[2], (string) microtime(true), LOCK_EX);
    });
    exit(0);
}

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

check('klik_with_lock menjalankan callback dan mengembalikan nilainya', function (): void {
    $result = klik_with_lock('test-store-basic', static fn() => 'ok');
    expect_same('ok', $result, 'Hasil callback');
});

check('klik_with_lock reentrant untuk nama lock yang sama', function (): void {
    $result = klik_with_lock('test-store-reentrant', static function (): string {
        return klik_with_lock('test-store-reentrant', static fn() => 'nested');
    });

    expect_same('nested', $result, 'Hasil lock bertingkat');
});

check('klik_with_lock melepas lock saat callback melempar exception', function (): void {
    try {
        klik_with_lock('test-store-exception', static function (): void {
            throw new RuntimeException('boom');
        });
    } catch (RuntimeException $error) {
        expect_same('boom', $error->getMessage(), 'Exception diteruskan');
    }

    $again = klik_with_lock('test-store-exception', static fn() => 'released');
    expect_same('released', $again, 'Lock bisa dipakai lagi');
});

check('klik_with_lock menolak nama lock yang tidak valid', function (): void {
    try {
        klik_with_lock('../evil', static fn() => null);
    } catch (InvalidArgumentException) {
        return;
    }

    throw new RuntimeException('Nama lock tidak valid tidak ditolak.');
});

check('klik_with_lock antar-proses saling menunggu', function (): void {
    $start = tempnam(sys_get_temp_dir(), 'klik-lock-start-');
    $end = tempnam(sys_get_temp_dir(), 'klik-lock-end-');
    $marker = tempnam(sys_get_temp_dir(), 'klik-lock-marker-');
    @unlink($start);
    @unlink($end);
    @unlink($marker);

    $hold = proc_open(
        [PHP_BINARY, __FILE__, '--hold', $start, $end],
        [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $holdPipes
    );
    if (!is_resource($hold)) {
        throw new RuntimeException('Gagal menjalankan proses pemegang lock.');
    }

    usleep(100000);

    $wait = proc_open(
        [PHP_BINARY, __FILE__, '--wait', $marker],
        [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $waitPipes
    );
    if (!is_resource($wait)) {
        throw new RuntimeException('Gagal menjalankan proses penunggu lock.');
    }

    $holdOut = stream_get_contents($holdPipes[1]) . stream_get_contents($holdPipes[2]);
    $waitOut = stream_get_contents($waitPipes[1]) . stream_get_contents($waitPipes[2]);
    fclose($holdPipes[1]);
    fclose($holdPipes[2]);
    fclose($waitPipes[1]);
    fclose($waitPipes[2]);

    $holdCode = proc_close($hold);
    $waitCode = proc_close($wait);

    if ($holdCode !== 0 || $waitCode !== 0) {
        throw new RuntimeException("Proses anak gagal: hold={$holdCode} ({$holdOut}) wait={$waitCode} ({$waitOut})");
    }

    $startAt = (float) file_get_contents($start);
    $endAt = (float) file_get_contents($end);
    $markerAt = (float) file_get_contents($marker);

    if ($endAt <= $startAt) {
        throw new RuntimeException('Waktu pemegang lock tidak valid.');
    }
    if ($markerAt < $endAt) {
        throw new RuntimeException(sprintf(
            'Lock tidak eksklusif: penunggu masuk pada %.4f, pemegang selesai pada %.4f.',
            $markerAt,
            $endAt
        ));
    }

    @unlink($start);
    @unlink($end);
    @unlink($marker);
});

check('klik_update_json membaca, mengubah, dan menulis ulang data', function (): void {
    $name = 'test-store-atomic';
    $file = dirname(__DIR__) . '/php/data/' . $name . '.json';
    @unlink($file);

    klik_update_json($name, static fn(array $data): array => [...$data, 'a'], []);
    $result = klik_update_json($name, static fn(array $data): array => [...$data, 'b'], []);

    expect_same(['a', 'b'], $result, 'Hasil dua update berurutan');
    expect_same(['a', 'b'], klik_read_json($name), 'Isi file di disk');
    expect_same([], glob($file . '.tmp.*'), 'Tidak ada temp file tersisa');

    @unlink($file);
});

// Bersihkan lock file dan data uji.
foreach (['test-store-basic', 'test-store-reentrant', 'test-store-exception', 'test-store-cross'] as $name) {
    @unlink(dirname(__DIR__) . '/php/data/' . $name . '.lock');
}
@unlink(dirname(__DIR__) . '/php/data/test-store-atomic.json');
foreach (glob(dirname(__DIR__) . '/php/data/test-store-atomic.json.tmp.*') ?: [] as $tmp) {
    @unlink($tmp);
}

echo "\n";
if ($passed !== $total) {
    echo "{$passed}/{$total} kasus lulus.\n";
    exit(1);
}

echo "OK {$passed}/{$total} kasus lulus.\n";
