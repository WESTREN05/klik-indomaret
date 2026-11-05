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
 * Baca file JSON. Mengembalikan default bila file belum ada / rusak.
 */
function klik_read_json(string $name, array $default = []): array
{
    $file = klik_data_file($name);
    if (!is_file($file)) {
        return $default;
    }

    $raw = file_get_contents($file);
    if ($raw === false || trim($raw) === '') {
        return $default;
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : $default;
}

/**
 * Tulis file JSON secara atomik (temporary file + rename).
 */
function klik_write_json(string $name, array $data): void
{
    $file = klik_data_file($name);
    $tmp = $file . '.tmp.' . getmypid();
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($json === false) {
        throw new RuntimeException('Gagal mengubah data menjadi JSON.');
    }
    if (file_put_contents($tmp, $json, LOCK_EX) === false) {
        throw new RuntimeException('Gagal menulis file data.');
    }
    if (!rename($tmp, $file)) {
        @unlink($tmp);
        throw new RuntimeException('Gagal menyimpan file data.');
    }
}

/**
 * Baca, ubah, dan tulis file JSON dalam satu lock.
 * Mutator harus mengembalikan array baru.
 */
function klik_update_json(string $name, callable $mutator, array $default = []): array
{
    $file = klik_data_file($name);
    $handle = fopen($file, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Gagal membuka file data.');
    }

    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Gagal mengunci file data.');
        }

        $raw = stream_get_contents($handle);
        $data = ($raw !== false && trim($raw) !== '') ? json_decode($raw, true) : $default;
        if (!is_array($data)) {
            $data = $default;
        }

        $result = $mutator($data);
        if (!is_array($result)) {
            $result = $data;
        }

        $json = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            throw new RuntimeException('Gagal mengubah data menjadi JSON.');
        }

        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, $json);
        fflush($handle);
        flock($handle, LOCK_UN);

        return $result;
    } finally {
        fclose($handle);
    }
}
