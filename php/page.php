<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/lib/page-boot.php';

/**
 * Render halaman HTML yang sudah ada, lalu suntikkan data session PHP
 * agar frontend langsung tahu siapa yang sedang login.
 */
function klik_page(string $template): void
{
    $root = dirname(__DIR__);
    $allowed = [
        'index.html',
        'kategori.html',
        'produk.html',
        'keranjang.html',
        'login.html',
        'akun.html',
        'promo.html',
    ];

    if (!in_array($template, $allowed, true)) {
        http_response_code(404);
        header('Content-Type: text/html; charset=utf-8');
        echo '<!doctype html><html lang="id"><meta charset="utf-8"><title>404</title>'
            . '<body style="font-family:system-ui;padding:40px"><h1>Halaman tidak ditemukan</h1>'
            . '<a href="/">Kembali ke beranda</a></body></html>';
        return;
    }

    $path = $root . DIRECTORY_SEPARATOR . $template;
    if (!is_file($path)) {
        http_response_code(500);
        header('Content-Type: text/html; charset=utf-8');
        echo 'Template halaman tidak ditemukan: ' . klik_e($template);
        return;
    }

    $html = file_get_contents($path);
    if ($html === false) {
        http_response_code(500);
        header('Content-Type: text/html; charset=utf-8');
        echo 'Gagal membaca template halaman.';
        return;
    }

    $user = klik_current_user();
    $bootstrap = [
        'php' => true,
        'apiBase' => 'api',
        'user' => $user !== null ? klik_public_user($user) : null,
        'claimed' => $user !== null ? klik_claimed_codes((int) $user['id']) : [],
        'used' => $user !== null ? klik_used_codes((int) $user['id']) : [],
    ];

    $script = klik_page_bootstrap_script($bootstrap);

    $needle = '<script src="js/data.js"></script>';
    if (str_contains($html, $needle)) {
        $html = str_replace($needle, $script . "\n  " . $needle, $html);
    } else {
        $html = str_replace('</body>', $script . "\n</body>", $html);
    }

    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo $html;
}
