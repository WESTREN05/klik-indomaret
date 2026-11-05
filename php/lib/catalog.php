<?php
declare(strict_types=1);

/**
 * Katalog produk & voucher untuk validasi pesanan di server.
 * Datanya dihasilkan dari js/data.js + js/products.js ke php/data/catalog.json.
 */

function klik_catalog(): array
{
    static $catalog = null;
    if ($catalog === null) {
        $catalog = klik_read_json('catalog', []);
    }

    return $catalog;
}

function klik_products(): array
{
    $products = klik_catalog()['products'] ?? [];
    return is_array($products) ? $products : [];
}

function klik_product(string $id): ?array
{
    foreach (klik_products() as $product) {
        if (($product['id'] ?? '') === $id) {
            return $product;
        }
    }

    return null;
}

function klik_vouchers(): array
{
    $vouchers = klik_catalog()['vouchers'] ?? [];
    return is_array($vouchers) ? $vouchers : [];
}

function klik_voucher(string $code): ?array
{
    foreach (klik_vouchers() as $voucher) {
        if (($voucher['code'] ?? '') === $code) {
            return $voucher;
        }
    }

    return null;
}
