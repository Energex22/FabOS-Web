param(
    [string]$EnvFile = "C:\FabVex\FabOS\deployment\windows\server.env"
)

$ErrorActionPreference = "Stop"

function Read-EnvFile($Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "FabVex environment file was not found: $Path"
    }
    $values = @{}
    foreach ($line in Get-Content -LiteralPath $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith("#") -or $trimmed -notmatch "^([^=]+)=(.*)$") {
            continue
        }
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        $values[$key] = $value
    }
    return $values
}

$envValues = Read-EnvFile $EnvFile
$domain = [string]$envValues["DUCKDNS_DOMAIN"]
$token = [string]$envValues["DUCKDNS_TOKEN"]
if (-not $domain -or -not $token) {
    throw "DUCKDNS_DOMAIN and DUCKDNS_TOKEN must be present in $EnvFile."
}
if ($domain -notmatch "^[a-z0-9-]+$") {
    throw "DUCKDNS_DOMAIN is invalid."
}

$query = "domains=$([uri]::EscapeDataString($domain))&token=$([uri]::EscapeDataString($token))&verbose=true"
$response = Invoke-WebRequest -UseBasicParsing -Uri "https://www.duckdns.org/update?$query" -TimeoutSec 15
$result = $response.Content.Trim()
if (-not $result.ToLowerInvariant().StartsWith("ok")) {
    throw "DuckDNS rejected the update: $result"
}

Write-Host "DuckDNS updated: $domain"
