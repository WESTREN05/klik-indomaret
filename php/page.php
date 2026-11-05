<?php
declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

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
    ];

    $json = json_encode(
        $bootstrap,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );

    $script = '<script>(function(){var boot=' . $json . ';window.KLIK_BOOTSTRAP=boot;'
        . 'try{'
        // Cache pesanan hanya dibuang saat tidak ada user. Saat user login,
        // akun.js akan menggantinya setelah sinkronisasi server berhasil.
        . 'if(!boot.user)localStorage.removeItem("klik_orders_v1");'
        . 'if(boot.user){localStorage.setItem("klik_user_v1",JSON.stringify(boot.user));'
        . 'if(typeof boot.user.saldo==="number")localStorage.setItem("klik_saldo_v1",JSON.stringify(boot.user.saldo));'
        . 'if(typeof boot.user.points==="number")localStorage.setItem("klik_points_v1",JSON.stringify(boot.user.points));'
        . '}else{localStorage.removeItem("klik_user_v1");'
        . 'localStorage.removeItem("klik_saldo_v1");'
        . 'localStorage.removeItem("klik_points_v1");}'
        . 'if(Array.isArray(boot.claimed))localStorage.setItem("klik_claimed_v1",JSON.stringify(boot.claimed));'
        . '}catch(e){}'
        . '})();</script>';

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
