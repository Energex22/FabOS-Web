# FabOS-Web

Customer-facing frontend for the 3D-printing business system. The customer experience is intentionally separated from the internal FabOS operations backend.

## Current customer flows

- `/` — main landing page, shop preview, custom-work CTA, FAQ
- `/shop.html` — dedicated searchable product catalog
- `/product.html?id=dock` — configurable product experience
- `/custom-work.html` — four-step custom project request flow
- `/checkout.html` — cart review, customer/shipping details, and order-flow prototype

## Cart architecture

Configured products use the shared `fabos.cart` browser-storage key through `src/cart.js`. This provides a temporary client-side bridge while the real cart, checkout, payment, customer, quote, and order APIs are connected to FabOS.

## Product configuration

The current prototype supports material, color, quantity, and calculated pricing. Material pricing is illustrative until production pricing is supplied by the backend.

## API boundary

The frontend should remain responsible for presentation, customer input, and local interaction. Production truth—customers, quotes, orders, payment status, pricing snapshots, production status, files, and fulfillment—belongs in the FabOS backend/API.

## Development

```bash
npm install
npm run dev
```

Build with:

```bash
npm run build
```
