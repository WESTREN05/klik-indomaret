<?php
declare(strict_types=1);

/**
 * Aturan harga di server. Semua angka dan aturan voucher dibaca dari
 * php/data/catalog.json, yang dihasilkan `npm run build:catalog` dari
 * js/data.js (settings + vouchers[].rules). Tidak ada aturan yang ditulis
 * ulang di sini, jadi harga dan voucher hanya punya satu sumber.
 */

function klik_settings(): array
{
    $settings = klik_catalog()['settings'] ?? [];
    return is_array($settings) ? $settings : [];
}

function klik_setting(string $key, int $default = 0): int
{
    $value = klik_settings()[$key] ?? null;
    return is_numeric($value) ? (int) $value : $default;
}

/**
 * Potongan satu voucher, rumusnya sama dengan discountFor() di js/pricing.js:
 *   fixed + min(cap, round(subtotal * percent / 100)) + min(shipping, ongkir)
 */
function klik_voucher_discount(array $voucher, int $subtotal, int $shippingFee): int
{
    $rules = is_array($voucher['rules'] ?? null) ? $voucher['rules'] : [];
    $discount = (int) ($rules['fixed'] ?? 0);

    $percent = (float) ($rules['percent'] ?? 0);
    if ($percent > 0) {
        $amount = (int) round($subtotal * $percent / 100);
        $cap = (int) ($rules['cap'] ?? 0);
        $discount += $cap > 0 ? min($cap, $amount) : $amount;
    }

    $shippingCap = (int) ($rules['shipping'] ?? 0);
    if ($shippingCap > 0) {
        $discount += min($shippingCap, $shippingFee);
    }

    return max(0, $discount);
}
