<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

$user = klik_require_user();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$action = strtolower(trim((string) ($_GET['action'] ?? '')));

try {
    if ($method === 'GET') {
        $orders = 0;
        foreach (klik_read_json('orders') as $order) {
            if ((int) ($order['user_id'] ?? 0) === (int) $user['id']) {
                $orders++;
            }
        }

        klik_json_response([
            'ok' => true,
            'user' => klik_public_user($user),
            'stats' => ['orders' => $orders],
        ]);
    }

    if ($method === 'POST' && $action === 'topup') {
        $data = klik_request_json();
        $amount = (int) ($data['amount'] ?? 0);

        if (!in_array($amount, [50000, 100000, 200000, 500000], true)) {
            klik_json_response(['ok' => false, 'error' => 'Nominal top up tidak valid.'], 422);
        }

        klik_update_json('users', static function (array $users) use ($user, $amount): array {
            foreach ($users as &$item) {
                if ((int) ($item['id'] ?? 0) === (int) $user['id']) {
                    $item['saldo'] = (int) ($item['saldo'] ?? 0) + $amount;
                    break;
                }
            }
            unset($item);

            return $users;
        }, []);

        $freshUser = klik_find_user_by_id((int) $user['id']);

        klik_json_response([
            'ok' => true,
            'user' => klik_public_user($freshUser ?? $user),
            'message' => 'Top up berhasil.',
        ]);
    }

    if ($method === 'POST') {
        $data = klik_request_json();
        $name = trim((string) ($data['name'] ?? ''));
        $phone = klik_normalize_phone((string) ($data['phone'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));

        if (mb_strlen($name) < 3) {
            klik_json_response(['ok' => false, 'error' => 'Nama minimal 3 karakter.'], 422);
        }
        if ($phone !== '' && !preg_match('/^\d{10,15}$/', $phone)) {
            klik_json_response(['ok' => false, 'error' => 'Nomor HP harus 10–15 digit angka.'], 422);
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            klik_json_response(['ok' => false, 'error' => 'Format email belum benar.'], 422);
        }

        foreach (klik_read_json('users') as $other) {
            if ((int) ($other['id'] ?? 0) === (int) $user['id']) {
                continue;
            }
            if ($phone !== '' && klik_normalize_phone((string) ($other['phone'] ?? '')) === $phone) {
                klik_json_response(['ok' => false, 'error' => 'Nomor HP sudah dipakai akun lain.'], 409);
            }
            if ($email !== '' && strtolower((string) ($other['email'] ?? '')) === $email) {
                klik_json_response(['ok' => false, 'error' => 'Email sudah dipakai akun lain.'], 409);
            }
        }

        klik_update_json('users', static function (array $users) use ($user, $name, $phone, $email): array {
            foreach ($users as &$item) {
                if ((int) ($item['id'] ?? 0) === (int) $user['id']) {
                    $item['name'] = $name;
                    $item['phone'] = $phone;
                    $item['email'] = $email;
                    break;
                }
            }
            unset($item);

            return $users;
        }, []);

        $freshUser = klik_find_user_by_id((int) $user['id']);

        klik_json_response([
            'ok' => true,
            'user' => klik_public_user($freshUser ?? $user),
        ]);
    }

    klik_json_response(['ok' => false, 'error' => 'Metode tidak diizinkan.'], 405);
} catch (Throwable $error) {
    error_log('[Klik profile] ' . $error->getMessage());
    klik_json_response(['ok' => false, 'error' => 'Profil gagal diproses.'], 500);
}
