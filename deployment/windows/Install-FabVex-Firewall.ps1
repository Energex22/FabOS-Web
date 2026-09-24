param(
    [string]$RulePrefix = "FabVex Public Web"
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script from an elevated PowerShell window."
}

$rules = @(
    @{ Name = "$RulePrefix HTTP";  Port = 80 },
    @{ Name = "$RulePrefix HTTPS"; Port = 443 }
)

foreach ($rule in $rules) {
    Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue |
        Remove-NetFirewallRule -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $rule.Port -Profile Domain,Private,Public | Out-Null
}

Write-Host "Allowed inbound TCP 80 and 443 for FabVEX web traffic."
Write-Host "Do not create an inbound rule for TCP 8000; the FabOS API must remain loopback-only."
