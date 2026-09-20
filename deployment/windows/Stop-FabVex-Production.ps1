$ErrorActionPreference = "SilentlyContinue"
Get-Process caddy | Stop-Process -Force
Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" | Where-Object { $_.CommandLine -match "fabos_api\.server" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
Write-Host "FABVEX production processes stopped."
