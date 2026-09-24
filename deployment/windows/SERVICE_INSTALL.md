# FabVex Windows service installation

These scripts install the production API and Caddy as automatic Windows
services. Run them from an elevated PowerShell prompt after the interactive
bring-up in Start-FabVex-Production.ps1 has been verified.

The API remains bound to 127.0.0.1:8000. Caddy is the only public boundary.

## Install

    powershell -ExecutionPolicy Bypass -File .\Install-FabVex-Services.ps1

Optional paths:

    .\Install-FabVex-Services.ps1 -FabOSDir C:\FabVex\FabOS -CaddyDir C:\FabVex\Server

The installer:
- validates the FabOS API entry point and Caddyfile
- validates Caddy configuration
- creates/updates the API and Caddy services
- configures automatic startup
- configures service failure recovery
- starts the API first and verifies /api/v1/health
- starts Caddy only after the API is healthy

## Remove

    powershell -ExecutionPolicy Bypass -File .\Install-FabVex-Services.ps1 -Remove

Do not run the interactive production launcher at the same time as these
services. Both modes start the same API/Caddy listeners.

## Backup task

The API creates a daily backup when it starts and the desktop creates a
shutdown backup, but unattended server operation should also have a scheduled
backup independent of either process. Use:

    powershell -ExecutionPolicy Bypass -File .\Install-FabVex-BackupTask.ps1

The task runs daily under SYSTEM and invokes the FabOS backup CLI against the
persistent data directory. Keep the backup directory on a different physical
disk or synchronized destination when possible; a backup on the same disk
does not protect against disk failure.

## Security

Do not store payment credentials in these scripts. Production secrets belong
in the private server environment file or Windows service environment and
must never be committed to Git.
