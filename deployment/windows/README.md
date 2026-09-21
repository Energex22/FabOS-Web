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
