# FabOS-Web

Customer-facing frontend for the 3D-printing business. The customer experience is intentionally separated from the internal operations system.

## Current customer flows

- `/` — main landing page, shop preview, custom-work CTA, FAQ
- `/shop.html` — dedicated searchable product catalog
- `/product.html?id=dock` — configurable product experience
- `/custom-work.html` — four-step custom project request flow
- `/checkout.html` — cart review, customer/shipping details, and order capture foundation
- `/orders.html` — customer order history foundation

## Shared customer data

- `src/catalog.js` — shared products, categories, materials, colors, and product lookup
- `src/cart.js` — shared multi-item cart stored under `fabos.cart` during the prototype phase
- `src/customer-contracts.js` — versioned payload shapes for future customer quote/order API calls
- `src/quote-store.js` — temporary browser-side custom request storage
- `src/order-store.js` — temporary browser-side order storage

Configured product variants carry an explicit `productId`, `variantId`, and `configuration` object so the eventual backend can distinguish choices such as material and color without parsing display text.

## Pricing

The current material adjustments are illustrative. Production pricing, availability, taxes, shipping rules, discounts, and pricing snapshots must ultimately come from the backend rather than being treated as customer-side truth.

## API boundary

`src/api.js` is the single customer API adapter boundary. The frontend is responsible for presentation, customer input, and local interaction. Production truth belongs in the backend, including customers, quotes, orders, payment state, pricing snapshots, production status, files, and fulfillment.

The adapter currently defines future quote/order calls but does not pretend those endpoints are live. The shared customer contracts are versioned separately so the frontend payload shape can be aligned with the backend before live submission is enabled.

## Prototype limitations

The current customer flow intentionally works without a live backend connection:

- Orders and custom requests are stored only in the current browser/device.
- No payment is processed.
- Uploaded custom files are currently represented by file metadata; binary upload/storage will be connected when the backend file service is ready.
- Customer accounts and server-side order history are not enabled yet.

## Multi-page build

Vite builds the main, shop, product, custom-work, checkout, and orders entry points together. Each major customer workflow can therefore evolve independently while remaining one frontend project.

## Development

```bash
npm install
npm run dev
```

Build with:

```bash
npm run build
```
