# FabVex Windows production deployment

First-party Windows deployment template for the FabVex storefront and the
FabOS API.

For putting the site on a real domain with HTTPS, see
[DOMAIN_AND_HTTPS.md](DOMAIN_AND_HTTPS.md).

## Architecture

    Browser -> Caddy HTTPS -> static FabOS-Web files
                           -> /api/* -> FabOS on 127.0.0.1:8000

Caddy is the only public web boundary. Do not expose port 8000 (the FabOS API)
or 5173 (the Vite dev server) through the router.

Because Caddy serves the storefront and proxies `/api` on the same hostname,
browser requests are same-origin and no CORS configuration is needed.
`FABOS_CORS_ORIGINS` only applies if the storefront is hosted on a different
origin than the API.

## Target layout

    C:\FabVex\FabOS          FabOS backend checkout
    C:\FabVex\FabOS-Web      storefront checkout, built into dist\
    C:\FabVex\Server         caddy.exe and Caddyfile
    C:\FabVex\Data           FabOS data directory, outside any checkout

`Start-FabVex-Production.ps1` accepts `-FabOSDir`, `-FabOSWebDir`, and
`-CaddyDir` if the install lives elsewhere.

## Prerequisites

Install Git, Python 3.11, Node.js LTS, and Caddy for Windows. Give the server
PC a reserved LAN address.

## First server bring-up

1. Clone FabOS and FabOS-Web into the target directories.
2. Copy `.env.production.example` to `.env.production` in the FabOS-Web
   checkout.
3. Build the storefront:

       cd C:\FabVex\FabOS-Web
       npm install
       npm test
       npm run build

   Caddy serves the resulting `dist` directory.
4. Copy `Caddyfile` to `C:\FabVex\Server\Caddyfile` and replace `YOUR-DOMAIN`
   with the real storefront hostname.
5. Copy `server.env.example` to a private `server.env` in this directory and
   set `FABOS_DATA_DIR` to a directory outside any Git checkout.
6. Start the stack with `Start-FabVex-Production.ps1` for interactive bring-up/testing.
7. Confirm `http://127.0.0.1:8000/api/v1/health` locally.
8. For unattended operation after validation, install the API and Caddy as Windows services using `Install-FabVex-Services.ps1`. See `SERVICE_INSTALL.md`.
9. Install the independent daily backup task with `Install-FabVex-BackupTask.ps1`; do not rely only on process shutdown hooks for backups.
10. Only after local verification, configure DNS, router forwarding, and the
   firewall for ports 80 and 443. See
   [DOMAIN_AND_HTTPS.md](DOMAIN_AND_HTTPS.md).
11. Verify the storefront and `https://YOUR-DOMAIN/api/v1/health` from a device
   outside the home network.
12. Configure Stripe test-mode credentials and the webhook before accepting
    real payments.

## Router and firewall

Forward only TCP 80 and TCP 443 to the server PC. Do not forward 8000. Allow
Caddy through Windows Firewall for 80 and 443.

## Before going public

- configure real payment credentials and webhook secret
- configure the production data directory
- configure scheduled backups and test restoration
- test customer registration and login
- test Ready to Print to shop publication
- test cart and order creation
- test payment in the provider's test mode
- test custom-work uploads
- verify FabOS admin surfaces are not internet-accessible
- verify HTTPS from outside the home network
- test recovery after a server reboot

## Important

- Keep the FabOS database and Design Vault on persistent storage.
- Keep production environment files and payment secrets outside Git. Never
  commit payment secrets, database files, or customer uploads.
- Back up the FabOS data directory before upgrades.
- Do not run the Vite development server as the public production server.
- Do not publish FabOS desktop or admin pages through Caddy.
