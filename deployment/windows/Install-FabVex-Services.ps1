param(
    [string]$FabOSDir = "C:\FabVex\FabOS",
    [string]$CaddyDir = "C:\FabVex\Server",
    [string]$DataDir = "C:\FabVex\Data",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

function Require-Path($Path, $Label) {
    if (-not (Test-Path -LiteralPath $Path)) { throw "$Label was not found: $Path" }
}

function Run-Native($File, [string[]]$Arguments) {
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$File failed with exit code $LASTEXITCODE." }
}

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script from an elevated PowerShell window."
}

$apiService = "FabVex-FabOS-API"
$caddyService = "FabVex-Caddy"

if ($Remove) {
    foreach ($name in @($caddyService, $apiService)) {
        $existing = Get-Service -Name $name -ErrorAction SilentlyContinue
        if ($existing) {
            Stop-Service -Name $name -Force -ErrorAction SilentlyContinue
            Run-Native sc.exe @("delete", $name)
        }
    }
    Write-Host "FabVex production services removed."
    exit 0
}

Require-Path $FabOSDir "FabOS directory"
Require-Path (Join-Path $FabOSDir "fabos_api\server.py") "FabOS API server"
Require-Path $CaddyDir "Caddy directory"
Require-Path (Join-Path $CaddyDir "caddy.exe") "Caddy executable"
Require-Path (Join-Path $CaddyDir "Caddyfile") "Caddyfile"
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

$caddyExe = Join-Path $CaddyDir "caddy.exe"
$caddyFile = Join-Path $CaddyDir "Caddyfile"
$pythonExe = Join-Path $FabOSDir ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $pythonExe)) {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if (-not $python) { throw "Python was not found. Create the FabOS virtual environment or install Python on PATH." }
    $pythonExe = $python.Source
}

Write-Host "Validating Caddy..."
Run-Native $caddyExe @("validate","--config",$caddyFile)

foreach ($name in @($apiService, $caddyService)) {
    if (Get-Service -Name $name -ErrorAction SilentlyContinue) {
        Stop-Service -Name $name -Force -ErrorAction SilentlyContinue
        Run-Native sc.exe @("delete",$name)
        Start-Sleep -Seconds 1
    }
}

$apiBinPath = '"{0}" -m fabos_api.server' -f $pythonExe
$caddyBinPath = '"{0}" run --config "{1}"' -f $caddyExe, $caddyFile

Run-Native sc.exe @(
    "create",$apiService,"start=","auto","binPath=",$apiBinPath,
    "DisplayName=","FabVex FabOS API"
)
Run-Native sc.exe @("description",$apiService,"FabVex local production API on 127.0.0.1:8000")
Run-Native sc.exe @("failure",$apiService,"reset=","86400","actions=","restart/5000/restart/15000/restart/60000")
Run-Native sc.exe @("failureflag",$apiService,"1")

Run-Native sc.exe @(
    "create",$caddyService,"start=","auto","binPath=",$caddyBinPath,
    "DisplayName=","FabVex Caddy Web Gateway"
)
Run-Native sc.exe @("description",$caddyService,"FabVex HTTPS storefront and reverse proxy")
Run-Native sc.exe @("failure",$caddyService,"reset=","86400","actions=","restart/5000/restart/15000/restart/60000")
Run-Native sc.exe @("failureflag",$caddyService,"1")

# Service processes inherit the machine environment. The API deliberately
# remains loopback-only; Caddy owns the public HTTP/HTTPS listeners.
[Environment]::SetEnvironmentVariable("FABOS_API_HOST","127.0.0.1","Machine")
[Environment]::SetEnvironmentVariable("FABOS_API_PORT","8000","Machine")
[Environment]::SetEnvironmentVariable("FABOS_API_THREADS","8","Machine")
[Environment]::SetEnvironmentVariable("FABOS_DATA_DIR",$DataDir,"Machine")

Start-Service -Name $apiService
$healthy = $false
for ($i=0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 5
        if ($response.StatusCode -eq 200) { $healthy = $true; break }
    } catch {}
}
if (-not $healthy) {
    Stop-Service -Name $apiService -Force -ErrorAction SilentlyContinue
    throw "FabOS API service did not become healthy within 30 seconds."
}

Start-Service -Name $caddyService

Write-Host ""
Write-Host "FabVex production services installed and started."
Write-Host "  API:   $apiService"
Write-Host "  Caddy: $caddyService"
Write-Host "  Health: http://127.0.0.1:8000/api/v1/health"
Write-Host ""
