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
