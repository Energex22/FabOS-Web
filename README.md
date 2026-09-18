# FabOS-Web

Customer-facing frontend for the 3D-printing business. The customer experience is intentionally separated from the internal operations system.

## Current customer flows

- `/` — main landing page, shop preview, custom-work CTA, FAQ
- `/shop.html` — dedicated searchable product catalog
- `/product.html?id=dock` — configurable product experience
- `/custom-work.html` — four-step custom project request flow
- `/checkout.html` — cart review, customer/shipping details, and order capture foundation
- `/orders.html` — customer order history
- `/order.html?number=FBO-...` — individual order details and customer-facing progress timeline

## One-click Windows starter

For Windows users, double-click `start-fabos-web.bat` to start the site. On the first run it installs the required npm dependencies automatically, starts the local development server, waits for it to respond, and opens the customer site in the default browser.

A silent launcher is also included as `start-fabos-web-hidden.vbs` for users who prefer not to see the starter console window.

Node.js LTS is required. If Node.js is not installed, the starter explains what is needed instead of failing silently.

## Shared customer data

- `src/catalog.js` — shared products, categories, materials, colors, and product lookup
- `src/cart.js` — shared multi-item cart stored under `fabos.cart` during the prototype phase
- `src/customer-contracts.js` — versioned payload shapes for customer quote/order API calls
- `src/customer-store.js` — temporary browser-side customer identity/profile foundation
- `src/quote-store.js` — temporary browser-side custom request storage
- `src/order-store.js` — temporary browser-side order storage and customer-facing order status definitions

Configured product variants carry an explicit `productId`, `variantId`, and `configuration` object so the eventual backend can distinguish choices such as material and color without parsing display text.

## Pricing

Production pricing, availability, taxes, shipping rules, and final totals come from the backend. The browser cart is display state only.

## API boundary

`src/api.js` is the single customer API adapter boundary. It now includes the planned public catalog, authentication, customer profile, quote, and order operations. Authentication tokens are kept in browser storage only as a temporary client mechanism; passwords, sessions, customer ownership, pricing truth, payment state, and permissions remain backend responsibilities.

`docs/FABOS_API_CONTRACT.md` documents the proposed HTTP contract. The matching backend-side boundary is documented in the FabOS repository at `docs/CUSTOMER_API_CONTRACT.md`.

The adapter does not pretend the routes are live. Production truth belongs in FabOS, including customers, quotes, orders, payment state, pricing snapshots, production status, files, and fulfillment.

## Production-connected flows

The customer frontend is now connected to the live FabOS API boundary rather than using browser-local order/quote storage as the source of truth.

- Product catalog, product details, categories, variants, and published availability come from FabOS.
- Multi-item cart state is retained locally only as a convenience until checkout; final pricing and eligibility are revalidated by FabOS.
- Customer registration, login, logout, profile, quotes, orders, and payment-session creation use the backend.
- Custom-work requests can upload STL, 3MF, OBJ, STEP/STP files up to 25 MB.
- Checkout creates the server-side order first and then starts the configured payment session.
- Customer order pages expose only customer-safe progress and fulfillment information.

The frontend still requires the FabOS API to be running and requires a configured production payment provider before online payment can actually be completed.

## Backend alignment

The backend already has dedicated account/authentication, customer, quote, order, fulfillment, product, and customer-update services. The customer API should call those existing service boundaries rather than creating a second business-logic implementation in the web project.

The backend's customer ownership methods must remain authoritative for customer quote/order access. Customer-safe order statuses should be translated at the API boundary so internal workflow states are not exposed directly to customers.

## Multi-page build

Vite builds the main, shop, product, custom-work, checkout, orders, and order-detail entry points together. Each major customer workflow can therefore evolve independently while remaining one frontend project.

## Development

```bash
npm install
npm run dev
```

Build with:

```bash
npm run build
```
