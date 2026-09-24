# Domain and HTTPS setup

How to put the FabVex storefront on a real domain with working HTTPS, starting
from a Windows PC on a home internet connection.

Caddy obtains and renews certificates automatically, so there are no
certificate files to manage and no renewal task to schedule. Most of the work
below is DNS and router configuration, not Caddy configuration.

Tested against Caddy v2.11.4 (https://github.com/caddyserver/caddy/releases).

## Step 0: Check for CGNAT before buying anything

If your ISP places you behind carrier-grade NAT, inbound port forwarding cannot
reach this PC no matter how it is configured, and the tunnel approach at the
bottom of this document is the only option. Check first.

1. Open the router admin page and note the WAN / internet-facing IP address.
2. From any device on the same network, visit a "what is my IP" site.

If the two addresses **match**, port forwarding will work. If they **differ**,
the connection is behind CGNAT. Background:
https://stackademic.com/blog/cgnat-for-self-hosters-how-to-know-port-forwarding-is-not-your-problem

## Step 1: Register a domain

Budget roughly 10-15 USD per year. Cloudflare Registrar sells at cost;
Porkbun and Namecheap are also reasonable.

Regardless of registrar, consider pointing the domain's nameservers at
Cloudflare DNS (free). It is not required for a basic setup, but it enables
three things this document relies on later:

- the DNS-01 certificate challenge, if the ISP blocks inbound port 80
- automatic DNS record updates when a dynamic IP address changes
- Cloudflare Tunnel as a fallback when port forwarding is impossible

## Step 2: Create the DNS record

Add a single `A` record pointing at the public IP address from Step 0.

| Field | Value |
| --- | --- |
| Type | `A` |
| Name | `@` for `example.com`, or `shop` for `shop.example.com` |
| Value | the public IP address of the internet connection |

If using Cloudflare DNS, set the record to **DNS only** (grey cloud) rather
than Proxied (orange cloud). Proxied mode prevents Caddy from completing its
own certificate challenge. The proxy can be enabled later once HTTPS works.

## Step 3: Reserve a LAN address and forward ports

1. In the router's DHCP settings, reserve a fixed LAN address for the server PC
   so it does not change after a reboot.
2. Forward **TCP 80** and **TCP 443** to that address.
3. Allow Caddy through Windows Firewall on ports 80 and 443.

Forward nothing else. In particular do not forward 8000 (the FabOS API) or
5173 (the Vite dev server). Caddy is the only public entry point; port 80 is
required for the certificate challenge and 443 serves live traffic.

Spectrum states it does not block ports 80 or 443, although ISP-supplied
modem/router combos sometimes do
(https://brisray.com/web/router.htm). If the certificate never issues, suspect
port blocking first and use the DNS-01 alternative below.

## Step 4: Configure the Caddyfile

Copy `Caddyfile` from this directory to `C:\FabVex\Server\Caddyfile`, then
replace `YOUR-DOMAIN` with the real hostname.

The template already has the correct site root (`C:\FabVex\FabOS-Web\dist`),
the `/api/*` reverse proxy to `127.0.0.1:8000`, SPA-style fallback routing, and
security response headers. If the checkout lives somewhere other than
`C:\FabVex\`, update the `root` directive and pass matching paths to
`Start-FabVex-Production.ps1`.

## Step 5: Start Caddy and confirm the certificate

Run the stack with `Start-FabVex-Production.ps1`, or start Caddy alone from
`C:\FabVex\Server`:

    caddy run --config C:\FabVex\Server\Caddyfile

Caddy contacts Let's Encrypt, proves domain control over port 80, installs the
certificate, and begins serving HTTPS. Look for `certificate obtained
successfully` in the output.

Then verify from **a phone on cellular data**, not from inside the home
network:

- `https://YOUR-DOMAIN/` should load the storefront
- `https://YOUR-DOMAIN/api/v1/health` should return `{"ok": true, ...}`

Testing from inside the network often fails even when everything is correct,
because many home routers cannot route back to their own public IP address.
This is called NAT hairpinning and its absence is not a real fault.

## Step 6: Survive reboots

`caddy run` stops when its window closes. To keep the site up across restarts,
install Caddy as a Windows service. Per
https://caddyserver.com/docs/running:

    sc.exe create caddy start= auto binPath= "C:\FabVex\Server\caddy.exe run --config C:\FabVex\Server\Caddyfile"
    sc.exe start caddy

The spaces after `start=` and `binPath=` are required `sc.exe` syntax.

Two things to know:

- Pass `--config` explicitly, as above. Windows services start with their
  working directory set to `System32`, so Caddy will not discover a Caddyfile
  by looking beside its own executable.
- The service runs under a different account than an interactive shell, so
  Caddy uses a different certificate storage directory and will obtain a fresh
  certificate the first time it starts as a service. This is expected.

`caddy reload` applies Caddyfile changes without a restart. Windows services
themselves cannot be reloaded, only restarted.

The same documentation page covers WinSW, which adds log rotation.

Note that running Caddy as a service and also running
`Start-FabVex-Production.ps1` would start Caddy twice and the second instance
will fail to bind. Pick one.

## Dynamic IP addresses

Most residential connections change public IP address occasionally, which
silently breaks the `A` record from Step 2.

Caddy can maintain its own DNS record using the dynamic DNS app
(https://github.com/mholt/caddy-dynamicdns), configured in the global options
block at the top of the Caddyfile:

    {
    	dynamic_dns {
    		provider cloudflare {env.CLOUDFLARE_API_TOKEN}
    		domains {
    			YOUR-DOMAIN
    		}
    		check_interval 5m
    	}
    }

This module is not part of the standard Caddy binary. Download a build with it
included from the Caddy download page, or compile one with `xcaddy`. Supply the
Cloudflare API token through the environment rather than writing it into the
Caddyfile; `server.env` is a suitable place, since
`Start-FabVex-Production.ps1` loads it into the process environment.

## When port forwarding is not possible

### Cloudflare Tunnel

Preferred when behind CGNAT or when the ISP blocks inbound ports. A local agent
makes an **outbound** connection to Cloudflare, which then routes the public
hostname back through it. No port forwarding, no inbound firewall rules, and no
dynamic DNS. Cloudflare terminates HTTPS, so Caddy's role reduces to serving
the built files locally. Overview:
https://evezone.evetech.co.za/build-lab/how-to-expose-a-self-hosted-app-to-the-internet-with-cloudflare-tunnel

### DNS-01 certificate challenge

Appropriate when the connection has a genuine public IP address but inbound
port 80 is blocked. Caddy proves domain control by writing a temporary DNS
record instead of answering an inbound request, so only port 443 needs to be
reachable. Requires the `caddy-dns/cloudflare` plugin and an API token.

## After the domain is live

### Leave VITE_API_URL alone

`.env.production.example` sets `VITE_API_URL=/api` deliberately. The browser
requests `/api/...` from the same hostname that served the page, so requests
are same-origin.

This means **no CORS configuration is required**. `FABOS_CORS_ORIGINS` only
matters if the storefront is ever hosted on a different origin than the API,
such as a GitHub Pages deployment. Keeping the storefront and API on one origin
avoids exposing the API cross-origin at all, which is the main security benefit
of this architecture.

### Update the payment redirect URLs

In the private `server.env`, replace the placeholder hostnames:

    STRIPE_SUCCESS_URL=https://YOUR-DOMAIN/orders.html
    STRIPE_CANCEL_URL=https://YOUR-DOMAIN/checkout.html

### Re-run the pre-launch checklist

See the "Before going public" section of `README.md`. Two items deserve a real
test once the site is publicly reachable:

- confirm FabOS desktop and admin surfaces are not reachable through Caddy
- confirm the site and `/api/v1/health` respond over HTTPS from outside the
  home network

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Certificate never issues | Port 80 not reachable: DNS not yet propagated, port forward wrong, ISP blocking, or Cloudflare proxy enabled |
| Works on phone, fails at home | NAT hairpinning; not a real fault |
| Caddy starts but serves nothing | `root` path does not match the actual `dist` directory |
| Storefront loads, API calls fail | FabOS API not running on `127.0.0.1:8000`; check `http://127.0.0.1:8000/api/v1/health` locally |
| Site dies after reboot | Caddy not installed as a service |
| Site breaks after days or weeks | Public IP changed; add dynamic DNS |
| Caddy fails to bind on start | Already running as a service, or another process holds 80/443 |
