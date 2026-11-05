<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

$action = strtolower(trim((string) ($_GET['action'] ?? 'me')));

try {
    if ($action === 'me') {
        klik_require_method('GET');
        $user = klik_current_user();
        if ($user === null) {
            klik_json_response(['ok' => false, 'error' => 'Belum masuk.'], 401);
        }

        klik_json_response([
            'ok' => true,
            'user' => klik_public_user($user),
            'claimed' => klik_claimed_codes((int) $user['id']),
        ]);
    }

    if ($action === 'login') {
        klik_require_method('POST');
        $data = klik_request_json();
        $contact = trim((string) ($data['contact'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($contact === '' || $password === '') {
            klik_json_response(['ok' => false, 'error' => 'Nomor HP/email dan password wajib diisi.'], 422);
        }

        $user = klik_find_user_by_contact($contact);
        if ($user === null || !password_verify($password, (string) ($user['password_hash'] ?? ''))) {
            klik_json_response(['ok' => false, 'error' => 'Nomor HP/email atau password salah.'], 401);
        }

        klik_login_user((int) $user['id']);

        klik_json_response([
            'ok' => true,
            'user' => klik_public_user($user),
            'claimed' => klik_claimed_codes((int) $user['id']),
        ]);
    }

    if ($action === 'register') {
        klik_require_method('POST');
        $data = klik_request_json();
        $name = trim((string) ($data['name'] ?? ''));
        $phone = klik_normalize_phone((string) ($data['phone'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        $password = (string) ($data['password'] ?? '');

        if (mb_strlen($name) < 3) {
            klik_json_response(['ok' => false, 'error' => 'Nama minimal 3 karakter.'], 422);
        }
        if (!preg_match('/^\d{10,15}$/', $phone)) {
            klik_json_response(['ok' => false, 'error' => 'Nomor HP harus 10–15 digit angka.'], 422);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            klik_json_response(['ok' => false, 'error' => 'Format email belum benar.'], 422);
        }
        if (strlen($password) < 6) {
            klik_json_response(['ok' => false, 'error' => 'Password minimal 6 karakter.'], 422);
        }

        try {
            klik_update_json('users', static function (array $users) use ($name, $phone, $email, $password): array {
                foreach ($users as $user) {
                    if (klik_normalize_phone((string) ($user['phone'] ?? '')) === $phone) {
                        throw new RuntimeException('Nomor HP sudah terdaftar.');
                    }
                    if (strtolower((string) ($user['email'] ?? '')) === $email) {
                        throw new RuntimeException('Email sudah terdaftar.');
                    }
                }

                $nextId = 1;
                foreach ($users as $user) {
                    $nextId = max($nextId, (int) ($user['id'] ?? 0) + 1);
                }

                $users[] = [
                    'id' => $nextId,
                    'name' => $name,
                    'phone' => $phone,
                    'email' => $email,
                    'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                    'joined' => date(DATE_ATOM),
                    'saldo' => 0,
                    'points' => 0,
                    'created_at' => date(DATE_ATOM),
                ];

                return $users;
            }, []);
        } catch (RuntimeException $error) {
            $message = $error->getMessage();
            if (str_contains($message, 'sudah terdaftar')) {
                klik_json_response(['ok' => false, 'error' => $message], 409);
            }
            throw $error;
        }

        $created = klik_find_user_by_contact($email);
        if ($created === null) {
            klik_json_response(['ok' => false, 'error' => 'Akun gagal dibuat.'], 500);
        }

        klik_login_user((int) $created['id']);

        klik_json_response([
            'ok' => true,
            'user' => klik_public_user($created),
            'claimed' => [],
        ], 201);
    }

    if ($action === 'logout') {
        klik_require_method('POST');
        klik_logout_user();
        klik_json_response(['ok' => true]);
    }

    if ($action === 'forgot') {
        klik_require_method('POST');
        $data = klik_request_json();
        $contact = trim((string) ($data['contact'] ?? ''));

        if ($contact === '') {
            klik_json_response(['ok' => false, 'error' => 'Isi nomor HP atau email dulu.'], 422);
        }

        // Respons dibuat generik supaya tidak membocorkan apakah akun terdaftar.
        klik_json_response([
            'ok' => true,
            'message' => 'Kalau akunnya ada, tautan reset sudah dikirim (demo).',
        ]);
    }

    klik_json_response(['ok' => false, 'error' => 'Aksi auth tidak dikenal.'], 404);
} catch (Throwable $error) {
    error_log('[Klik auth] ' . $error->getMessage());
    klik_json_response(['ok' => false, 'error' => 'Terjadi kesalahan pada server.'], 500);
}
