<?php
declare(strict_types=1);

/**
 * Router untuk PHP built-in server:
 *   php -S 127.0.0.1:8000 -t C:\klik-indomaret C:\klik-indomaret\router.php
 *
 * - /api/*  -> endpoint JSON
 * - /       -> halaman Beranda lewat PHP (session ikut disuntikkan)
 * - *.html  -> tetap dirender lewat PHP agar user session terbaca
 * - aset    -> dilayani langsung oleh built-in server
 */

function klik_router_deny(string $message = 'Akses ditolak.'): bool
{
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message]);
    return true;
}

$root = __DIR__;

$rawUri = $_SERVER['REQUEST_URI'] ?? '/';
$uri = parse_url($rawUri, PHP_URL_PATH);
$uri = is_string($uri) && $uri !== '' ? rawurldecode($uri) : '/';

// Tolak null byte dan backslash sebelum path dipakai untuk mencari file.
if (str_contains($uri, "\0") || str_contains($uri, '\\')) {
    return klik_router_deny('Path tidak valid.');
}

// Normalisasi path: buang segmen kosong/titik dan tolak traversal.
$segments = [];
foreach (explode('/', $uri) as $segment) {
    if ($segment === '' || $segment === '.') {
        continue;
    }
    if ($segment === '..') {
        return klik_router_deny();
    }
    $segments[] = $segment;
}
$uri = '/' . implode('/', $segments);
if ($uri !== '/' && str_ends_with($uri, '/')) {
    $uri = rtrim($uri, '/');
}

// Jangan pernah membocorkan data JSON / konfigurasi lewat browser.
$blockedRoots = ['php', '.vscode', '.git', '_backup_sebelum_fix'];
$firstSegment = strtolower(explode('/', ltrim($uri, '/'))[0] ?? '');
if (in_array($firstSegment, $blockedRoots, true)) {
    return klik_router_deny();
}

// Endpoint API.
if (str_starts_with($uri, '/api/')) {
    $file = realpath($root . $uri);
    $apiRoot = realpath($root . '/api');

    if (
        $file !== false
        && $apiRoot !== false
        && str_starts_with($file, $apiRoot . DIRECTORY_SEPARATOR)
        && is_file($file)
        && str_ends_with($file, '.php')
    ) {
        require $file;
        return true;
    }

    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Endpoint API tidak ditemukan.']);
    return true;
}

if ($uri === '/health') {
    require $root . '/api/health.php';
    return true;
}

// URL bersih.
$routes = [
    '/' => 'index.html',
    '/beranda' => 'index.html',
    '/kategori' => 'kategori.html',
    '/produk' => 'produk.html',
    '/keranjang' => 'keranjang.html',
    '/login' => 'login.html',
    '/akun' => 'akun.html',
    '/promo' => 'promo.html',
];

if (isset($routes[$uri])) {
    require_once $root . '/php/page.php';
    klik_page($routes[$uri]);
    return true;
}

// File .html tetap dilayani lewat PHP supaya session login terbaca.
$pageMap = [
    '/index.html' => 'index.html',
    '/kategori.html' => 'kategori.html',
    '/produk.html' => 'produk.html',
    '/keranjang.html' => 'keranjang.html',
    '/login.html' => 'login.html',
    '/akun.html' => 'akun.html',
    '/promo.html' => 'promo.html',
];

if (isset($pageMap[$uri])) {
    require_once $root . '/php/page.php';
    klik_page($pageMap[$uri]);
    return true;
}

// Aset statis (css, js, gambar, file .php wrapper).
$file = realpath($root . $uri);
if (
    $file !== false
    && str_starts_with($file, $root . DIRECTORY_SEPARATOR)
    && is_file($file)
) {
    // Lapisan kedua: jangan layani file yang resolve ke folder privat,
    // meskipun URI-nya sudah lolos normalisasi di atas.
    foreach ($blockedRoots as $blockedRoot) {
        $blockedDir = realpath($root . DIRECTORY_SEPARATOR . $blockedRoot);
        if (
            $blockedDir !== false
            && ($file === $blockedDir || str_starts_with($file, $blockedDir . DIRECTORY_SEPARATOR))
        ) {
            return klik_router_deny();
        }
    }

    return false;
}

http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
echo '<!doctype html><html lang="id"><meta charset="utf-8"><title>404 — Klik Indomaret</title>'
    . '<body style="font-family:system-ui;padding:40px"><h1>404</h1>'
    . '<p>Halaman tidak ditemukan.</p><a href="/">Kembali ke beranda</a></body></html>';
return true;
