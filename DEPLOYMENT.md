# FabOS-Web Deployment

FabOS-Web is the public storefront. FabOS remains the source of truth for products, prices, shipping, tax, orders, customer ownership, fulfillment, and payment state.

## Build

npm install
npm test
npm run build

## API configuration

For the supported Windows or Linux + Caddy production deployment, leave the frontend API base at the same-origin relative path:

VITE_API_URL=/api

Caddy serves the storefront and proxies /api/* to FabOS on 127.0.0.1:8000. This keeps the browser and API on one origin and avoids a public API hostname or CORS requirement.

Do not put Stripe secret keys or other private credentials in Vite environment variables. Anything prefixed with VITE_ is delivered to the browser.

## Hosting

Supported production deployments are Windows + Caddy (`deployment/windows/`) and Linux + Caddy (`deployment/linux/`). GitHub Pages remains disabled because a separate Pages origin would require a publicly reachable API and an explicit CORS configuration.

## Production rules

- Use HTTPS.
- Keep the FabOS API bound to 127.0.0.1 and expose it only through Caddy /api/*.
- Do not expose the FabOS desktop/admin UI publicly.
- Do not store authoritative prices, payment state, or customer ownership in browser storage.
- Browser cart data is only a convenience until the server creates the order.
- Never put Stripe secret credentials in this repository.

## Smoke test

1. Open the storefront in a private/incognito browser.
2. Load the public catalog.
3. Open a product detail page.
4. Create a customer account.
5. Add a product to the cart.
6. Submit checkout.
7. Confirm the order exists in FabOS.
8. Confirm a Stripe test payment session is created.
9. Complete a Stripe test payment.
10. Confirm the webhook updates FabOS.
11. Verify the customer-safe order status.
12. Test a failed payment and refund before live mode.
