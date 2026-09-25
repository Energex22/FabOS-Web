param(
    [string]$FabOSDir = "C:\FabVex\FabOS",
    [string]$CaddyDir = "C:\FabVex\Server",
    [string]$FabOSWebDir = "C:\FabVex\FabOS-Web",
    [string]$DataDir = "C:\FabVex\Data",
    [switch]$Remove,
    [string]$EnvFile = ""
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
Require-Path (Join-Path $FabOSWebDir "dist") "FabOS-Web built storefront"
Require-Path (Join-Path $CaddyDir "caddy.exe") "Caddy executable"
Require-Path (Join-Path $CaddyDir "Caddyfile") "Caddyfile"
if (-not $EnvFile) {
    $candidateEnvFile = Join-Path $PSScriptRoot "server.env"
    $fabosEnvFile = Join-Path $FabOSDir "deployment\windows\server.env"
    if (Test-Path -LiteralPath $candidateEnvFile) { $EnvFile = $candidateEnvFile }
    elseif (Test-Path -LiteralPath $fabosEnvFile) { $EnvFile = $fabosEnvFile }
}
if ($EnvFile) { Require-Path $EnvFile "FabVex server environment file" }
if ($EnvFile) {\n    & icacls.exe $EnvFile /inheritance:r /grant:r "SYSTEM:F" "Administrators:F" | Out-Null\n    if ($LASTEXITCODE -ne 0) { throw "Could not secure ACLs on $EnvFile." }\n}\nif ($EnvFile) {
    # The API and DuckDNS scheduled task run as SYSTEM. Keep secrets readable only by
    # SYSTEM and local administrators; do not rely on source-control exclusion alone.
    Run-Native icacls.exe @($EnvFile, "/inheritance:r", "/grant:r", "SYSTEM:F", "Administrators:F")
}
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$CaddyDataDir = Join-Path $CaddyDir "data"
$CaddyLogDir = Join-Path $CaddyDir "logs"
New-Item -ItemType Directory -Force -Path $CaddyDataDir, $CaddyLogDir | Out-Null

$caddyExe = Join-Path $CaddyDir "caddy.exe"
$caddyFile = Join-Path $CaddyDir "Caddyfile"
if (Select-String -LiteralPath $caddyFile -Pattern "YOUR-DOMAIN" -SimpleMatch -Quiet) {
    throw "Caddyfile still contains the YOUR-DOMAIN placeholder. Replace it with the real public hostname before installing production services."
}
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

$apiEntryPoint = Join-Path $FabOSDir "deployment\windows\run_api_service.py"
Require-Path $apiEntryPoint "FabOS Windows API service entry point"

$caddyBinPath = '"{0}" run --config "{1}" --data-dir "{2}"' -f $caddyExe, $caddyFile, $CaddyDataDir
$apiBinPath = '"{0}" "{1}" --host 127.0.0.1 --port 8000 --threads 8 --data-dir "{2}"' -f $pythonExe, $apiEntryPoint, $DataDir
if ($EnvFile) { $apiBinPath += ' --env-file "' + $EnvFile + '"' }

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
Run-Native sc.exe @("config",$caddyService,"depend=",$apiService)
Run-Native sc.exe @("failure",$caddyService,"reset=","86400","actions=","restart/5000/restart/15000/restart/60000")
Run-Native sc.exe @("failureflag",$caddyService,"1")

# The API service launches the Python interpreter directly. Its dedicated
# entry point adds the FabOS checkout to sys.path and receives all production
# paths as explicit arguments, so the service does not depend on a System32
# working directory or inherited services.exe environment.

Start-Service -Name $apiService
$healthy = $false
for ($i = 0; $i -lt 15; $i++) {
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

$duckDnsInstaller = Join-Path $PSScriptRoot "Install-FabVex-DuckDNS-Task.ps1"
if ($EnvFile -and (Test-Path -LiteralPath $duckDnsInstaller)) {
    $envText = Get-Content -LiteralPath $EnvFile -Raw
    if ($envText -match "(?m)^DUCKDNS_DOMAIN=.+$" -and $envText -match "(?m)^DUCKDNS_TOKEN=.+$") {
        & $duckDnsInstaller -EnvFile $EnvFile -FabOSDir $FabOSDir
        if ($LASTEXITCODE -ne 0) { throw "DuckDNS scheduled task installation failed." }
    }
}

Write-Host ""
Write-Host "FabVex production services installed and started."
Write-Host "  API:   $apiService"
Write-Host "  Caddy: $caddyService"
Write-Host "  Caddy data: $CaddyDataDir"
Write-Host "  Caddy logs: $CaddyLogDir"
if ($EnvFile) { Write-Host "  API env:    $EnvFile" }
Write-Host "  Health: http://127.0.0.1:8000/api/v1/health"
Write-Host ""
