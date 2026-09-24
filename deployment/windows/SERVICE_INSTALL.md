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

### Preflight checks

The service installer now verifies that the built storefront (`FabOS-Web\dist`) exists and refuses to install if the Caddyfile still contains the `YOUR-DOMAIN` placeholder. This prevents a superficially successful service installation from starting without a real storefront or hostname.


### Private API environment file

The API service can load the same private `server.env` used by the interactive launcher. Keep the file out of Git and restrict its Windows ACLs to the service account/administrators. If `deployment\\windows\\server.env` exists when the installer runs, it is automatically passed to the API service. A different file can be supplied explicitly with `-EnvFile`.

The environment file is read by the Python service entry point at startup, so payment credentials and other production settings survive Windows reboots instead of depending on an interactive PowerShell session. Explicit service arguments remain authoritative for the bind address, port, thread count, and data directory.
