<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

try {
    if ($method === 'GET') {
        $user = klik_current_user();
        klik_json_response([
            'ok' => true,
            'vouchers' => klik_vouchers(),
            'claimed' => $user !== null ? klik_claimed_codes((int) $user['id']) : [],
        ]);
    }

    if ($method === 'POST') {
        $user = klik_require_user();
        $data = klik_request_json();
        $code = strtoupper(trim((string) ($data['code'] ?? '')));

        if ($code === '') {
            klik_json_response(['ok' => false, 'error' => 'Kode voucher wajib diisi.'], 422);
        }
        if (klik_voucher($code) === null) {
            klik_json_response(['ok' => false, 'error' => 'Voucher tidak ditemukan.'], 404);
        }

        $claimed = klik_claim_voucher((int) $user['id'], $code);
        klik_json_response(['ok' => true, 'claimed' => $claimed]);
    }

    klik_json_response(['ok' => false, 'error' => 'Metode tidak diizinkan.'], 405);
} catch (Throwable $error) {
    error_log('[Klik vouchers] ' . $error->getMessage());
    klik_json_response(['ok' => false, 'error' => 'Voucher gagal diproses.'], 500);
}
