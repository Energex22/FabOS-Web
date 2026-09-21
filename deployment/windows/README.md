# FabVex Windows production deployment

This directory contains the first-party Windows deployment template for the
FabVex storefront + FabOS API.

## Architecture

Browser -> Caddy HTTPS -> static FabOS-Web files
                         -> /api/* -> FabOS on 127.0.0.1:8000

Caddy is the only public web boundary. Do not expose ports 8000 or 5173
directly through the router.

## First deployment

1. Build the storefront with `npm install`, `npm test`, and `npm run build`.
2. Install Caddy on the Windows server PC.
3. Copy this Caddyfile and replace `YOUR-DOMAIN` with the real storefront hostname.
4. Adjust the `root` path if FabOS-Web lives somewhere other than
   `C:\FabOS\FabOS-Web\dist`.
5. Configure FabOS to listen only on `127.0.0.1:8000`.
6. Set FabOS `FABOS_CORS_ORIGINS` to the exact public storefront origin.
7. Start Caddy with this Caddyfile.
8. Verify the storefront and `/api/v1/health` over HTTPS.
9. Configure Stripe test-mode credentials and the webhook before accepting
   real payments.

## Important

- Keep FabOS's database and Design Vault on persistent storage.
- Keep production environment files and Stripe secrets outside Git.
- Back up the FabOS data directory before upgrades.
- Do not run the development Vite server as the public production server.
- Do not publish FabOS desktop/admin pages through Caddy.
# FABVEX Windows Production Server

This prepares a Windows PC to host the public FABVEX storefront while keeping
the FabOS API private behind the web server.

Target layout:

    C:\FabVex\FabOS
    C:\FabVex\FabOS-Web
    C:\FabVex\Server

Public traffic:
    https://your-domain.example/

Internal:
    Caddy -> 127.0.0.1:8000 -> FabOS API

## Prerequisites

Install Git, Python 3.11, Node.js LTS, and Caddy for Windows.
Give the server PC a reserved LAN address.

## Build the storefront

Copy .env.production.example to .env.production.

Then:

    cd C:\FabVex\FabOS-Web
    npm install
    npm run build

Caddy serves the resulting dist directory.

## Caddy

Copy Caddyfile.example to C:\FabVex\Server\Caddyfile and replace the
example domain.

Caddy automatically manages HTTPS certificates when the domain resolves to
the server and ports 80/443 are reachable.

## FabOS API

Run the API on 127.0.0.1:8000. Do not expose port 8000 to the Internet.

## Router/firewall

Forward only TCP 80 and TCP 443 to the server PC. Do not forward 8000.
Allow Caddy through Windows Firewall for 80/443.

## DNS

Point the domain A/AAAA record(s) at the public Internet connection used by
the server.

If the ISP uses CGNAT and inbound port forwarding cannot work, use a hosted
server or secure tunnel instead.

## Before going public

- configure real payment credentials and webhook secret
- configure production data directory
- configure scheduled backups and test restoration
- test customer registration/login
- test Ready to Print -> shop publication
- test cart/order creation
- test payment in provider test mode
- test custom-work uploads
- verify FabOS admin is not Internet-accessible
- verify HTTPS from outside the home network
- test recovery after a server reboot

Do not use Vite's development server as the public production web server.

## First server bring-up

1. Clone FabOS and FabOS-Web into the target directories.
2. Install Python 3.11, Node.js LTS, Git, and Caddy.
3. Run `npm install` and `npm run build` in FabOS-Web.
4. Copy `Caddyfile.example` to the Server directory and replace the domain.
5. Set the production `FABOS_DATA_DIR` to a directory outside the Git checkout.
6. Start the stack with `Start-FabVex-Production.ps1`.
7. Confirm `http://127.0.0.1:8000/api/v1/health` locally.
8. Only after local verification, configure DNS/router/firewall for 80/443.
9. Test the site from a device outside the home network.

Never put payment secrets, database files, or customer uploads in the Git repository.
