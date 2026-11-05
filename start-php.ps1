param(
    [int]$Port = 8000,
    [string]$HostAddress = '127.0.0.1'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Find-Php {
    $cmd = Get-Command php -ErrorAction SilentlyContinue
    if ($cmd) {
        try {
            & $cmd.Source -v *> $null
            if ($LASTEXITCODE -eq 0) { return $cmd.Source }
        } catch {
            # lanjut cari di lokasi umum
        }
    }

    $candidates = @(
        'C:\laragon\bin\php\php-8.2.21-nts-Win32-vs16-x64\php.exe',
        'C:\xampp\php\php.exe',
        'C:\php\php.exe',
        (Join-Path $env:LOCALAPPDATA 'Programs\php\php.exe')
    )

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) { return $candidate }
    }

    $laragon = Get-ChildItem 'C:\laragon\bin\php' -Recurse -Filter php.exe -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($laragon) { return $laragon.FullName }

    return $null
}

$php = Find-Php
if (-not $php) {
    Write-Host 'PHP tidak ditemukan.' -ForegroundColor Red
    Write-Host 'Install PHP 8.1+ atau sesuaikan path di start-php.ps1.' -ForegroundColor Yellow
    Write-Host 'Contoh path Laragon: C:\laragon\bin\php\php-8.2.21-nts-Win32-vs16-x64\php.exe' -ForegroundColor Yellow
    exit 1
}

$listener = $null
try {
    $listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
} catch {
    $listener = $null
}

if ($listener) {
    Write-Host "Port $Port sudah dipakai." -ForegroundColor Red
    Write-Host "Coba port lain: .\start-php.ps1 -Port 8001" -ForegroundColor Yellow
    exit 1
}

Write-Host 'Klik Indomaret PHP server' -ForegroundColor Cyan
Write-Host "PHP    : $php"
Write-Host "Folder : $root"
Write-Host "URL    : http://${HostAddress}:$Port/"
Write-Host "API    : http://${HostAddress}:$Port/api/health.php"
Write-Host 'Tekan Ctrl+C untuk berhenti.' -ForegroundColor DarkGray
Write-Host "Listening on http://${HostAddress}:$Port" -ForegroundColor Green

& $php -d display_errors=1 -d error_reporting=E_ALL -S "${HostAddress}:$Port" -t $root "$root\router.php"
