<?php
declare(strict_types=1);

/**
 * Bentuk order yang aman dikirim ke frontend.
 */
function klik_public_order(array $order): array
{
    unset($order['user_id']);
    return $order;
}
