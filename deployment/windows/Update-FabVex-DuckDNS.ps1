param(
    [Parameter(Mandatory=$true)]
    [string]$EnvFile
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    throw "FabVex environment file was not found: $EnvFile"
}

$values = @{}
foreach ($line in Get-Content -LiteralPath $EnvFile) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#") -or $trimmed.StartsWith(";")) { continue }
    $parts = $trimmed -split "=", 2
    if ($parts.Count -ne 2) { continue }
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    $values[$key] = $value
}

$domain = [string]$values["DUCKDNS_DOMAIN"]
$token = [string]$values["DUCKDNS_TOKEN"]
if (-not $domain -or -not $token) {
    throw "DUCKDNS_DOMAIN and DUCKDNS_TOKEN are required in the private environment file."
}
if ($domain -notmatch "^[a-z0-9-]+$") {
    throw "DUCKDNS_DOMAIN contains an invalid DuckDNS subdomain."
}

$uri = "https://www.duckdns.org/update?domains=$([uri]::EscapeDataString($domain))&token=$([uri]::EscapeDataString($token))&verbose=true"
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec 20
    $body = ($response.Content | Out-String).Trim()
} catch {
    throw "DuckDNS update request failed: $($_.Exception.Message)"
}

if (-not $body.ToLowerInvariant().StartsWith("ok")) {
    throw "DuckDNS rejected the update."
}

Write-Host "DuckDNS update succeeded for $domain."
