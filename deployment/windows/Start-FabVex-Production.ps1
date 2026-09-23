param(
    [string]$FabOSDir = "C:\FabVex\FabOS",
    [string]$FabOSWebDir = "C:\FabVex\FabOS-Web",
    [string]$CaddyDir = "C:\FabVex\Server"
)

$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "server.env"
if (Test-Path -LiteralPath $envFile) {
    Get-Content -LiteralPath $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
        }
    }
}

function Require-Path($Path, $Label) {
    if (-not (Test-Path -LiteralPath $Path)) { throw "$Label was not found: $Path" }
}

Require-Path $FabOSDir "FabOS directory"
Require-Path (Join-Path $FabOSDir "fabos_api\server.py") "FabOS API server"
Require-Path $FabOSWebDir "FabOS-Web directory"
Require-Path (Join-Path $FabOSWebDir "dist") "Production storefront build"
Require-Path (Join-Path $CaddyDir "Caddyfile") "Caddyfile"
Require-Path (Join-Path $CaddyDir "caddy.exe") "Caddy executable"

$caddyExe = Join-Path $CaddyDir "caddy.exe"
$caddyFile = Join-Path $CaddyDir "Caddyfile"
Write-Host "Validating Caddy configuration..."
& $caddyExe validate --config $caddyFile
if ($LASTEXITCODE -ne 0) { throw "Caddy configuration validation failed." }

$env:FABOS_API_HOST = "127.0.0.1"
$env:FABOS_API_PORT = "8000"
$env:FABOS_API_THREADS = "8"
if (-not $env:FABOS_DATA_DIR) { $env:FABOS_DATA_DIR = "C:\FabVex\Data" }

Write-Host "Starting FabOS API on 127.0.0.1:8000..."
$api = Start-Process -FilePath "python" -ArgumentList "-m","fabos_api.server" -WorkingDirectory $FabOSDir -PassThru -WindowStyle Hidden

$healthy = $false
for ($attempt = 1; $attempt -le 15; $attempt++) {
    Start-Sleep -Seconds 2
    if ($api.HasExited) { break }
    try {
        $health = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 5
        if ($health.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        # The API may still be importing modules or opening the database.
    }
}
if (-not $healthy) {
    if (-not $api.HasExited) { Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue }
    throw "FabOS API did not become healthy within 30 seconds. Check the Python/runtime configuration."
}

Write-Host "Starting Caddy..."
try {
    $caddy = Start-Process -FilePath $caddyExe -ArgumentList "run","--config",$caddyFile -WorkingDirectory $CaddyDir -PassThru
    Start-Sleep -Seconds 2
    if ($caddy.HasExited) {
        throw "Caddy exited during startup. Check the Caddy configuration and certificate/DNS settings."
    }
} catch {
    if (-not $api.HasExited) { Stop-Process -Id $api.Id -Force -ErrorAction SilentlyContinue }
    throw
}

Write-Host ""
Write-Host "FABVEX production stack is running."
Write-Host "API PID:   $($api.Id)"
Write-Host "Caddy PID: $($caddy.Id)"
Write-Host ""
