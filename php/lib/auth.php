<?php
declare(strict_types=1);

/**
 * Helper autentikasi, profil, dan klaim voucher.
 */

function klik_normalize_phone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if (str_starts_with($digits, '62')) {
        $digits = '0' . substr($digits, 2);
    }
    if (str_starts_with($digits, '8')) {
        $digits = '0' . $digits;
    }

    return $digits;
}

function klik_public_user(array $user): array
{
    return [
        'id' => (int) ($user['id'] ?? 0),
        'name' => (string) ($user['name'] ?? ''),
        'phone' => (string) ($user['phone'] ?? ''),
        'email' => (string) ($user['email'] ?? ''),
        'joined' => (string) ($user['joined'] ?? ''),
        'saldo' => (int) ($user['saldo'] ?? 0),
        'points' => (int) ($user['points'] ?? 0),
    ];
}

function klik_find_user_by_id(int $id): ?array
{
    foreach (klik_read_json('users') as $user) {
        if ((int) ($user['id'] ?? 0) === $id) {
            return $user;
        }
    }

    return null;
}

function klik_find_user_by_contact(string $contact): ?array
{
    $contact = trim($contact);
    if ($contact === '') {
        return null;
    }

    $isEmail = str_contains($contact, '@');
    $phone = klik_normalize_phone($contact);
    $email = strtolower($contact);

    foreach (klik_read_json('users') as $user) {
        if ($isEmail) {
            if (strtolower((string) ($user['email'] ?? '')) === $email) {
                return $user;
            }
        } elseif ($phone !== '' && klik_normalize_phone((string) ($user['phone'] ?? '')) === $phone) {
            return $user;
        }
    }

    return null;
}

function klik_current_user(): ?array
{
    $id = $_SESSION['user_id'] ?? null;
    if ($id === null) {
        return null;
    }

    $user = klik_find_user_by_id((int) $id);
    if ($user === null) {
        unset($_SESSION['user_id']);
        return null;
    }

    return $user;
}

function klik_login_user(int $id): void
{
    $_SESSION['user_id'] = $id;
    session_regenerate_id(true);
}

function klik_logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'] ?? '/',
            $params['domain'] ?? '',
            (bool) ($params['secure'] ?? false),
            (bool) ($params['httponly'] ?? true)
        );
    }

    session_destroy();
}

function klik_require_user(): array
{
    $user = klik_current_user();
    if ($user === null) {
        klik_json_response(['ok' => false, 'error' => 'Kamu harus masuk dulu.'], 401);
    }

    return $user;
}

function klik_claimed_codes(int $userId): array
{
    $codes = [];
    foreach (klik_read_json('voucher_claims') as $claim) {
        if ((int) ($claim['user_id'] ?? 0) === $userId) {
            $code = (string) ($claim['code'] ?? '');
            if ($code !== '' && !in_array($code, $codes, true)) {
                $codes[] = $code;
            }
        }
    }

    return $codes;
}

function klik_claim_voucher(int $userId, string $code): array
{
    $code = strtoupper(trim($code));
    if ($code === '') {
        return klik_claimed_codes($userId);
    }

    klik_update_json('voucher_claims', static function (array $claims) use ($userId, $code): array {
        foreach ($claims as $claim) {
            if ((int) ($claim['user_id'] ?? 0) === $userId && (string) ($claim['code'] ?? '') === $code) {
                return $claims;
            }
        }

        $claims[] = [
            'user_id' => $userId,
            'code' => $code,
            'claimed_at' => date(DATE_ATOM),
        ];

        return $claims;
    }, []);

    return klik_claimed_codes($userId);
}
