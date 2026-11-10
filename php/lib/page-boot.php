<?php
declare(strict_types=1);

/**
 * Bangun <script> bootstrap halaman. Dipisah dari php/page.php supaya
 * perilaku sinkronisasi cache localStorage bisa diuji tanpa memuat session.
 */
function klik_page_bootstrap_script(array $bootstrap): string
{
    $json = json_encode(
        $bootstrap,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );

    if ($json === false) {
        $json = 'null';
    }

    return '<script>(function(){var boot=' . $json . ';window.KLIK_BOOTSTRAP=boot;'
        . 'try{'
        // Saat session habis, buang cache akun supaya data lama tidak tampil
        // untuk tamu atau akun berikutnya. Keranjang dan pilihan kirim tetap.
        . 'if(!boot.user){'
        . 'localStorage.removeItem("klik_orders_v1");'
        . 'localStorage.removeItem("klik_address_v1");'
        . 'localStorage.removeItem("klik_store_v1");'
        . 'var stale=[];for(var i=0;i<localStorage.length;i++){'
        . 'var k=localStorage.key(i);'
        . 'if(k&&k.indexOf("klik_orders_v1:")===0)stale.push(k);'
        . '}'
        . 'for(var j=0;j<stale.length;j++)localStorage.removeItem(stale[j]);'
        . 'localStorage.removeItem("klik_user_v1");'
        . 'localStorage.removeItem("klik_saldo_v1");'
        . 'localStorage.removeItem("klik_points_v1");'
        . '}else{'
        . 'localStorage.setItem("klik_user_v1",JSON.stringify(boot.user));'
        . 'if(typeof boot.user.saldo==="number")localStorage.setItem("klik_saldo_v1",JSON.stringify(boot.user.saldo));'
        . 'if(typeof boot.user.points==="number")localStorage.setItem("klik_points_v1",JSON.stringify(boot.user.points));'
        . '}'
        . 'if(Array.isArray(boot.claimed))localStorage.setItem("klik_claimed_v1",JSON.stringify(boot.claimed));'
        . 'if(Array.isArray(boot.used))localStorage.setItem("klik_used_v1",JSON.stringify(boot.used));'
        . '}catch(e){}'
        . '})();</script>';
}
