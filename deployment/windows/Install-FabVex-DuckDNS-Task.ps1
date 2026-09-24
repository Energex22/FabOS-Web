param(
    [string]$EnvFile = "",
    [string]$TaskName = "FabVex-DuckDNS-Update",
    [int]$IntervalMinutes = 10,
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script from an elevated PowerShell window."
}

$updater = Join-Path $PSScriptRoot "Update-FabVex-DuckDNS.ps1"

if ($Remove) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed scheduled task: $TaskName"
    exit 0
}

if (-not $EnvFile) {
    $candidate = Join-Path $PSScriptRoot "server.env"
    $fabosCandidate = Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) "FabOS\deployment\windows\server.env"
    if (Test-Path -LiteralPath $candidate) { $EnvFile = $candidate }
    elseif (Test-Path -LiteralPath $fabosCandidate) { $EnvFile = $fabosCandidate }
}
if (-not $EnvFile) { throw "No server.env was supplied or found automatically." }
if (-not (Test-Path -LiteralPath $EnvFile)) { throw "Environment file was not found: $EnvFile" }
if (-not (Test-Path -LiteralPath $updater)) { throw "DuckDNS updater was not found: $updater" }
if ($IntervalMinutes -lt 5 -or $IntervalMinutes -gt 1440) { throw "IntervalMinutes must be between 5 and 1440." }

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument (
    '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" -EnvFile "{1}"' -f $updater, $EnvFile
)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1)
$trigger.RepetitionInterval = New-TimeSpan -Minutes $IntervalMinutes
$trigger.RepetitionDuration = New-TimeSpan -Days 3650
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName $TaskName

Write-Host "Installed scheduled task: $TaskName"
Write-Host "Update interval: every $IntervalMinutes minutes"
Write-Host "Environment file: $EnvFile"
