# race-checkout.ps1 — uji race condition pemakaian voucher saat checkout.
#
# PHP built-in server di Windows bersifat single-threaded, jadi dua request
# ke satu server akan diproses berurutan dan race tidak akan terlihat.
# Skrip ini menyalakan dua instance server (port berbeda) yang berbagi
# folder php/data, lalu mengirim checkout bersamaan memakai dua session
# berbeda untuk akun yang sama.
#
# PERINGATAN: skrip ini mereset php/data/users.json, orders.json, dan
# voucher_claims.json (memakai tools/reset-demo.php) dan menambah data
# padding sementara ke orders.json. Jangan jalankan pada data yang penting.
#
# Jalankan dari root project dengan server lain dimatikan:
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\race-checkout.ps1
#
# Opsi:
#   -Trials 10       jumlah percobaan (default 10)
#   -PadBytes 8000000  padding orders agar jendela race mudah diamati (0 = mati)
#   -Voucher SABTUMERIAH
#   -PortA 8001 -PortB 8002

param(
    [int]$PortA = 8001,
    [int]$PortB = 8002,
    [int]$Trials = 10,
    [int]$PadBytes = 8000000,
    [string]$Voucher = 'SABTUMERIAH',
    [string]$ProductId = 'sania-beras-5kg',
    [string]$Variant = '5kg',
    [int]$Qty = 2,
    [string]$Contact = '081234567890',
    [string]$Password = 'password123'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ('klik-race-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $temp | Out-Null

$servers = @()
$startedAt = Get-Date

function Wait-Health([int]$port) {
    for ($i = 0; $i -lt 60; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/api/health.php" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) { return }
        } catch {
            # server belum siap
        }
        Start-Sleep -Milliseconds 100
    }
    throw "Server di port $port tidak kunjung siap."
}

function Write-JsonFile([string]$path, $object) {
    $object | ConvertTo-Json -Compress -Depth 8 | Set-Content -LiteralPath $path -Encoding ASCII
}

function Invoke-Curl([string]$jar, [string]$url, [string]$bodyFile) {
    $responseFile = Join-Path $temp ('curl-' + [guid]::NewGuid().ToString('N') + '.json')
    $code = & curl.exe -s -o $responseFile -w '%{http_code}' -c $jar -b $jar `
        -X POST $url -H 'Content-Type: application/json' --data-binary "@$bodyFile"
    return [pscustomobject]@{
        Code = [int]$code
        Body = if (Test-Path $responseFile) { Get-Content $responseFile -Raw } else { '' }
    }
}

function Start-Checkout([string]$jar, [int]$port, [string]$bodyFile, [string]$tag) {
    $responseFile = Join-Path $temp ("resp-$tag.json")
    $codeFile = Join-Path $temp ("code-$tag.txt")
    # Header memakai "Content-Type:application/json" tanpa spasi supaya
    # Start-Process tidak memecahnya menjadi dua argumen.
    $process = Start-Process -FilePath 'curl.exe' -PassThru -NoNewWindow `
        -RedirectStandardOutput $codeFile `
        -ArgumentList @(
            '-s', '-o', $responseFile, '-w', '%{http_code}',
            '-X', 'POST', "http://127.0.0.1:$port/api/orders.php",
            '-H', 'Content-Type:application/json',
            '-b', $jar,
            '--data-binary', "@$bodyFile"
        )
    return [pscustomobject]@{ Process = $process; ResponseFile = $responseFile; CodeFile = $codeFile }
}

function Add-OrdersPadding([int]$bytes) {
    if ($bytes -le 0) { return }
    $padScript = Join-Path $temp 'pad-orders.php'
    if (-not (Test-Path $padScript)) {
        @'
<?php
$file = $argv[1];
$bytes = (int) $argv[2];
$orders = [[
    'id' => 'FILLER',
    'user_id' => 999999,
    'date' => '2000-01-01T00:00:00+07:00',
    'voucher' => null,
    'items' => [],
    'pad' => str_repeat('x', $bytes),
]];
file_put_contents($file, json_encode($orders, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
'@ | Set-Content -LiteralPath $padScript -Encoding ASCII
    }
    & php $padScript (Join-Path $root 'php\data\orders.json') $bytes | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Gagal menambah padding orders.' }
}

try {
    # Bersihkan state demo sebelum mulai.
    & php (Join-Path $root 'tools\reset-demo.php') | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Gagal mereset data demo.' }

    foreach ($port in @($PortA, $PortB)) {
        $logOut = Join-Path $temp ("server-$port-out.log")
        $logErr = Join-Path $temp ("server-$port-err.log")
        $servers += Start-Process -FilePath 'php' -PassThru -WindowStyle Hidden `
            -WorkingDirectory $root `
            -RedirectStandardOutput $logOut `
            -RedirectStandardError $logErr `
            -ArgumentList @('-S', "127.0.0.1:$port", 'router.php')
    }
    foreach ($port in @($PortA, $PortB)) { Wait-Health $port }

    $jarA = Join-Path $temp 'session-a.txt'
    $jarB = Join-Path $temp 'session-b.txt'
    $loginFile = Join-Path $temp 'login.json'
    Write-JsonFile $loginFile ([ordered]@{ contact = $Contact; password = $Password })

    $loginA = Invoke-Curl $jarA "http://127.0.0.1:$PortA/api/auth.php?action=login" $loginFile
    $loginB = Invoke-Curl $jarB "http://127.0.0.1:$PortB/api/auth.php?action=login" $loginFile
    if ($loginA.Code -ne 200 -or $loginB.Code -ne 200) {
        throw "Login gagal (A=$($loginA.Code), B=$($loginB.Code))."
    }

    $claimFile = Join-Path $temp 'claim.json'
    Write-JsonFile $claimFile ([ordered]@{ code = $Voucher })
    $claim = Invoke-Curl $jarA "http://127.0.0.1:$PortA/api/vouchers.php" $claimFile
    if ($claim.Code -ne 200) {
        throw "Klaim voucher gagal (HTTP $($claim.Code)): $($claim.Body)"
    }

    $bodyFile = Join-Path $temp 'checkout.json'
    Write-JsonFile $bodyFile ([ordered]@{
        items    = @(@{ id = $ProductId; variant = $Variant; qty = $Qty })
        delivery = 'express'
        method   = 'QRIS'
        voucher  = $Voucher
    })

    $doubleSuccess = 0
    $oneSuccess = 0
    $other = 0

    for ($trial = 1; $trial -le $Trials; $trial++) {
        # Reset agar voucher bisa dipakai lagi pada percobaan berikutnya.
        & php (Join-Path $root 'tools\reset-demo.php') | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Gagal reset data demo pada percobaan $trial." }

        # Perlebar jendela race: orders.json besar membuat pengecekan
        # "voucher sudah dipakai" berlangsung lebih lama di kedua request.
        Add-OrdersPadding $PadBytes

        $claim = Invoke-Curl $jarA "http://127.0.0.1:$PortA/api/vouchers.php" $claimFile
        if ($claim.Code -ne 200) {
            throw "Klaim voucher gagal pada percobaan $trial (HTTP $($claim.Code))."
        }

        $a = Start-Checkout $jarA $PortA $bodyFile "a$trial"
        $b = Start-Checkout $jarB $PortB $bodyFile "b$trial"
        $a.Process.WaitForExit()
        $b.Process.WaitForExit()

        $rawA = (Get-Content $a.CodeFile -Raw).Trim()
        $rawB = (Get-Content $b.CodeFile -Raw).Trim()
        $codeA = [int]([regex]::Match($rawA, '\d{3}').Value)
        $codeB = [int]([regex]::Match($rawB, '\d{3}').Value)
        $successes = @($codeA, $codeB | Where-Object { $_ -eq 201 }).Count

        switch ($successes) {
            2 { $doubleSuccess++; $label = 'RACE (dua-duanya 201)' }
            1 { $oneSuccess++; $label = 'aman (satu 201)' }
            default { $other++; $label = 'tidak terduga' }
        }

        Write-Output ("percobaan {0,2}: A={1} B={2} -> {3}" -f $trial, $codeA, $codeB, $label)
    }

    # Cek state akhir dari percobaan terakhir (tanpa reset lagi).
    $ordersFile = Join-Path $root 'php\data\orders.json'
    $usersFile = Join-Path $root 'php\data\users.json'
    $orders = @()
    if (Test-Path $ordersFile) {
        $rawOrders = Get-Content $ordersFile -Raw
        if ($rawOrders.Trim() -ne '') { $orders = $rawOrders | ConvertFrom-Json }
    }
    $users = Get-Content $usersFile -Raw | ConvertFrom-Json
    $demo = $users | Where-Object { [string]$_.phone -eq $Contact } | Select-Object -First 1
    $demoOrders = @($orders | Where-Object { [int]$_.user_id -eq [int]$demo.id })
    $voucherOrders = @($demoOrders | Where-Object { [string]$_.voucher -eq $Voucher })

    Write-Output ''
    Write-Output '=== Ringkasan ==='
    Write-Output ("Percobaan            : {0}" -f $Trials)
    Write-Output ("Dua-duanya sukses    : {0}" -f $doubleSuccess)
    Write-Output ("Tepat satu sukses    : {0}" -f $oneSuccess)
    Write-Output ("Hasil lain           : {0}" -f $other)
    Write-Output ("Order demo tersimpan : {0}" -f $demoOrders.Count)
    Write-Output ("Order pakai voucher  : {0}" -f $voucherOrders.Count)
    Write-Output ("Poin user (terakhir) : {0}" -f $demo.points)
    Write-Output ("Elapsed              : {0:n1} dtk" -f ((Get-Date) - $startedAt).TotalSeconds)

    if ($doubleSuccess -gt 0) {
        Write-Output 'KESIMPULAN: race condition MASIH ADA.'
        exit 1
    }

    Write-Output 'KESIMPULAN: hanya satu checkout yang berhasil; voucher tidak terpakai ganda.'
    exit 0
} finally {
    foreach ($server in $servers) {
        if ($server -and -not $server.HasExited) {
            Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}
