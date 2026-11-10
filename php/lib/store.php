<?php
declare(strict_types=1);

/**
 * Penyimpanan JSON sederhana dengan file locking.
 * Tidak membutuhkan MySQL, cocok untuk prototype tugas kuliah.
 */

function klik_data_dir(): string
{
    $dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Folder data PHP tidak bisa dibuat.');
    }

    return $dir;
}

function klik_data_file(string $name): string
{
    if (!preg_match('/^[a-z0-9_-]+$/i', $name)) {
        throw new InvalidArgumentException('Nama file data tidak valid.');
    }

    return klik_data_dir() . DIRECTORY_SEPARATOR . $name . '.json';
}

/**
 * Baca file JSON di bawah lock yang sama dengan penulis.
 * Lock yang sama ini penting: di Windows, rename() gagal bila file tujuan
 * sedang dibuka proses lain, jadi reader dan writer tidak boleh berlomba.
 */
function klik_read_json(string $name, array $default = []): array
{
    $file = klik_data_file($name);

    return klik_with_lock($name, static function () use ($file, $default): array {
        if (!is_file($file)) {
            return $default;
        }

        $handle = fopen($file, 'rb');
        if ($handle === false) {
            return $default;
        }

        try {
            $raw = stream_get_contents($handle);
        } finally {
            fclose($handle);
        }

        if ($raw === false || trim($raw) === '') {
            return $default;
        }

        $data = json_decode($raw, true);
        return is_array($data) ? $data : $default;
    });
}

/**
 * Tulis file JSON secara atomik (temporary file + rename).
 */
function klik_write_json(string $name, array $data): void
{
    $file = klik_data_file($name);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($json === false) {
        throw new RuntimeException('Gagal mengubah data menjadi JSON.');
    }

    klik_with_lock($name, static function () use ($file, $json): void {
        $tmp = $file . '.tmp.' . getmypid() . '.' . bin2hex(random_bytes(4));
        if (file_put_contents($tmp, $json, LOCK_EX) === false) {
            @unlink($tmp);
            throw new RuntimeException('Gagal menulis file data.');
        }
        if (!rename($tmp, $file)) {
            @unlink($tmp);
            throw new RuntimeException('Gagal menyimpan file data.');
        }
    });
}

/**
 * Jalankan callback sambil memegang lock eksklusif bernama.
 * Lock memakai file terpisah (<nama>.lock) di php/data, bukan file JSON-nya,
 * supaya aman dipakai bersama operasi baca-tulis.
 *
 * Reentrant-safe: pemanggilan bertingkat dengan nama lock yang sama tidak
 * membuka flock baru, jadi tidak deadlock. Nama berbeda tetap mengunci
 * terpisah, jadi jangan membuat urutan lock melingkar antar pemanggil.
 */
function klik_with_lock(string $lockName, callable $fn): mixed
{
    static $held = [];

    $key = strtolower(trim($lockName));
    if (!preg_match('/^[a-z0-9_-]+$/', $key)) {
        throw new InvalidArgumentException('Nama lock tidak valid.');
    }

    if (isset($held[$key])) {
        return $fn();
    }

    $file = klik_data_dir() . DIRECTORY_SEPARATOR . $key . '.lock';
    $handle = fopen($file, 'c');
    if ($handle === false) {
        throw new RuntimeException('Gagal membuka file lock.');
    }

    $locked = false;
    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Gagal mengunci operasi.');
        }
        $locked = true;
        $held[$key] = true;

        return $fn();
    } finally {
        unset($held[$key]);
        if ($locked) {
            flock($handle, LOCK_UN);
        }
        fclose($handle);
    }
}

/**
 * Baca, ubah, dan tulis file JSON dalam satu lock.
 * Mutator harus mengembalikan array baru. Penulisan memakai temporary file
 * lalu rename agar pembaca tidak pernah melihat isi file setengah jadi.
 */
function klik_update_json(string $name, callable $mutator, array $default = []): array
{
    $file = klik_data_file($name);

    return klik_with_lock($name, static function () use ($name, $file, $mutator, $default): array {
        $data = klik_read_json($name, $default);

        $result = $mutator($data);
        if (!is_array($result)) {
            $result = $data;
        }

        $json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Gagal mengubah data menjadi JSON.');
        }

        $tmp = $file . '.tmp.' . getmypid() . '.' . bin2hex(random_bytes(4));
        if (file_put_contents($tmp, $json, LOCK_EX) === false) {
            @unlink($tmp);
            throw new RuntimeException('Gagal menulis file data.');
        }
        if (!rename($tmp, $file)) {
            @unlink($tmp);
            throw new RuntimeException('Gagal menyimpan file data.');
        }

        return $result;
    });
}
