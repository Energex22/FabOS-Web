# FabOS Web — Pass 24

## What is connected

The customer storefront remains a separate frontend project and now consumes the existing FabOS API rather than duplicating catalog data.

- Public catalog: `GET /api/v1/catalog`
- Public categories: `GET /api/v1/catalog/categories`
- Public product detail: `GET /api/v1/catalog/{product_id}`
- API base defaults to `http://127.0.0.1:8000` for local development.
- `VITE_API_URL` or `VITE_API_BASE_URL` can override the API base.
- The homepage and product detail page fall back to the local preview catalog if the API is unavailable.
- The existing cart remains local until authenticated checkout/order creation is connected.

## Local test

1. Put `FabOS` beside `FabOS-Web`, or set `FABOS_DIR` to the FabOS directory.
2. Run `start-fabos-stack.bat` from the web project.
3. The API starts on `127.0.0.1:8000` and the storefront starts on `localhost:5173`.
4. Open the storefront in a browser and confirm the catalog loads from the backend.

The launcher does not replace or copy the FabOS backend. It starts the real backend API and the separate frontend together.

## CI

The frontend build is checked by GitHub Actions. The backend continues to run its Python 3.8 and 3.11 regression suite independently.

## Still intentionally not connected

Checkout currently records a browser-local prototype order. Before replacing that behavior with a real order, the backend needs the final customer-account creation flow, server-side cart/quote pricing, tax and shipping rules, and payment-provider integration. Those decisions should be supplied before implementation so the website never becomes a second source of truth.
