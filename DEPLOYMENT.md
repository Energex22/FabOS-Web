# FabOS-Web Deployment

FabOS-Web is the public storefront. FabOS remains the source of truth for products, prices, shipping, tax, orders, customer ownership, fulfillment, and payment state.

## Build

npm install
npm test
npm run build

## API configuration

Set VITE_API_URL to the public HTTPS FabOS API before building:

VITE_API_URL=https://api.YOUR-DOMAIN

Do not put Stripe secret keys or other private credentials in Vite environment variables. Anything prefixed with VITE_ is delivered to the browser.

## Hosting

The static frontend can be deployed on GitHub Pages, Cloudflare Pages, or Render Static Sites.

## Production rules

- Use HTTPS.
- Keep the FabOS API on a separate hostname such as api.YOUR-DOMAIN.
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
