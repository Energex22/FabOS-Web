param(
    [string]$FabOSDir = "C:\FabVex\FabOS",
    [string]$DataDir = "C:\FabVex\Data",
    [string]$TaskName = "FabVex-FabOS-Daily-Backup",
    [int]$Keep = 14,
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script from an elevated PowerShell window."
}

$backupScript = Join-Path $FabOSDir "deployment\windows\backup.ps1"
if (-not $Remove -and -not (Test-Path -LiteralPath $backupScript)) {
    throw "FabOS backup script was not found: $backupScript"
}

if ($Remove) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed scheduled task: $TaskName"
    exit 0
}

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
$wrapper = Join-Path $DataDir "run-fabos-daily-backup.cmd"
@"
@echo off
set "FABOS_DATA_DIR=$DataDir"
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$backupScript" -Keep $Keep
if errorlevel 1 exit /b %errorlevel%
"@ | Set-Content -LiteralPath $wrapper -Encoding ASCII

$action = New-ScheduledTaskAction -Execute $env:ComSpec -Argument ('/d /c ""{0}""' -f $wrapper)
$trigger = New-ScheduledTaskTrigger -Daily -At 03:15
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Write-Host "Installed scheduled task: $TaskName"
Write-Host "Daily time: 03:15 local server time"
Write-Host "Retention: $Keep backup(s)"
Write-Host "Data directory: $DataDir"
