# FABVEX Linux storefront deployment

This is the Linux counterpart to the supported Windows + Caddy deployment. It serves the built FabOS-Web storefront and proxies `/api/*` to the FabOS API on `127.0.0.1:8000`.

## Recommended layout

- FabOS: `/opt/fabos`
- FabOS-Web: `/opt/fabos-web`
- Storefront build: `/opt/fabos-web/dist`
- FabOS persistent data: `/var/lib/fabos`
- Caddy config: `/etc/caddy/Caddyfile`

## Build

    cd /opt/fabos-web
    npm ci
    npm test
    npm run build

The frontend uses same-origin `/api`, so no public API hostname is required and the browser does not need cross-origin credentials.

## Configure Caddy

Copy `deployment/linux/Caddyfile` to `/etc/caddy/Caddyfile`, keeping `fabvex.duckdns.org` or replacing it with the configured public hostname. Validate before restarting Caddy:

    sudo caddy validate --config /etc/caddy/Caddyfile
    sudo systemctl reload caddy

Caddy terminates HTTPS. Only ports 80 and 443 should be reachable from the Internet; port 8000 stays bound to localhost.

## Go-live sequence

1. Install and configure FabOS using `FabOS/deployment/linux/README.md`.
2. Run `python -m fabos_core.cli production-check` until it reports ready.
3. Build FabOS-Web with `npm ci`, `npm test`, and `npm run build`.
4. Configure Caddy and verify `https://fabvex.duckdns.org/api/v1/health`.
5. Test catalog, account, checkout, Stripe test payment, webhook, failed payment, and refund before switching Stripe to live mode.

Do not put Stripe secret keys or marketplace credentials into the frontend or Vite environment variables.
