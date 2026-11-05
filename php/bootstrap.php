<?php
declare(strict_types=1);

/**
 * Bootstrap bersama untuk semua endpoint API dan halaman PHP.
 * - Memulai session
 * - Memuat helper penyimpanan JSON
 * - Menyiapkan format respons JSON
 */

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('klik_session');
    session_start();
}

date_default_timezone_set('Asia/Jakarta');

require_once __DIR__ . '/lib/store.php';
require_once __DIR__ . '/lib/catalog.php';
require_once __DIR__ . '/lib/auth.php';
require_once __DIR__ . '/lib/order.php';

/**
 * Kirim respons JSON lalu hentikan request.
 */
function klik_json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Pastikan endpoint dipanggil dengan method tertentu.
 */
function klik_require_method(string $method): void
{
    $actual = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    if ($actual !== strtoupper($method)) {
        klik_json_response(['ok' => false, 'error' => 'Metode tidak diizinkan.'], 405);
    }
}

/**
 * Baca body JSON dari request.
 */
function klik_request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        klik_json_response(['ok' => false, 'error' => 'Body JSON tidak valid.'], 400);
    }

    return $data;
}

/**
 * Escape HTML untuk halaman PHP.
 */
function klik_e(mixed $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Siapkan data awal: akun demo + file pesanan/klaim voucher.
 */
function klik_seed_data(): void
{
    if (count(klik_read_json('users')) === 0) {
        klik_update_json('users', static function (array $users): array {
            if (count($users) > 0) {
                return $users;
            }

            return [[
                'id' => 1,
                'name' => 'Bagas Pratama',
                'phone' => '081234567890',
                'email' => 'bagas@email.com',
                'password_hash' => password_hash('password123', PASSWORD_DEFAULT),
                'joined' => date(DATE_ATOM),
                'saldo' => 185000,
                'points' => 4850,
                'created_at' => date(DATE_ATOM),
            ]];
        }, []);
    }

    foreach (['orders', 'voucher_claims'] as $name) {
        if (!is_file(klik_data_file($name))) {
            klik_write_json($name, []);
        }
    }
}

klik_seed_data();

// Error handling sederhana agar API tidak mengirim HTML error ke frontend.
set_exception_handler(static function (Throwable $error): void {
    error_log('[Klik Indomaret] ' . $error->getMessage());
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (str_starts_with($uri, '/api/')) {
        klik_json_response(['ok' => false, 'error' => 'Terjadi kesalahan pada server.'], 500);
    }

    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="id"><meta charset="utf-8"><title>Server error</title>'
        . '<body style="font-family:system-ui;padding:40px"><h1>Terjadi kesalahan</h1>'
        . '<p>Coba muat ulang halaman atau cek terminal PHP.</p></body></html>';
});
