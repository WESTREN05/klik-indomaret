<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/php/bootstrap.php';

klik_json_response([
    'ok' => true,
    'app' => 'Klik Indomaret',
    'php' => PHP_VERSION,
    'time' => date(DATE_ATOM),
    'storage_writable' => is_writable(klik_data_dir()),
    'users' => count(klik_read_json('users')),
    'orders' => count(klik_read_json('orders')),
]);
