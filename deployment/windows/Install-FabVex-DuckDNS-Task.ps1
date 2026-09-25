param(
    [string]$FabOSDir = "C:\FabVex\FabOS",
    [string]$TaskName = "FabVex-DuckDNS-Update",
    [switch]$Remove
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run this script from an elevated PowerShell window."
}

$envFile = Join-Path $FabOSDir "deployment\windows\server.env"
$updater = Join-Path $PSScriptRoot "Update-FabVex-DuckDNS.ps1"

if ($Remove) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed scheduled task: $TaskName"
    exit 0
}

if (-not (Test-Path -LiteralPath $envFile)) { throw "FabVex environment file was not found: $envFile" }
if (-not (Test-Path -LiteralPath $updater)) { throw "DuckDNS updater was not found: $updater" }

# Keep the secret file private while allowing the Windows administrator and
# Local System (the scheduled-task identity) to use it.
& icacls.exe $envFile /inheritance:r /grant:r "SYSTEM:F" "Administrators:F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Could not secure ACLs on $envFile." }

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "{0}" -EnvFile "{1}"' -f $updater, $envFile)
$triggers = @(
    New-ScheduledTaskTrigger -AtStartup
    New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 10)
)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings -Principal $principal -Force | Out-Null
Write-Host "Installed scheduled task: $TaskName"
Write-Host "DuckDNS refresh: at startup and every 10 minutes."
Write-Host "Environment file: $envFile"
