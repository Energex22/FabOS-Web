# FabOS customer API contract

This document defines the customer-facing HTTP boundary between FabOS-Web and the internal FabOS application. The routes are implemented in the FabOS backend; runtime availability still depends on the local or production FabOS service being started and configured.

## Base

- Development base URL: `http://127.0.0.1:8000`
- Production URL is supplied through `VITE_API_URL` or `VITE_API_BASE_URL`.
- JSON request/response bodies use UTF-8.
- Authenticated requests send `Authorization: Bearer <session-token>`.

## Public catalog

### `GET /api/v1/health`

Returns service availability.

### `GET /api/v1/catalog`

Optional query parameters: `q`, `category`, `sort`, `desc`.

Only FabOS products that are published, have a usable printable model, have a positive customer price, and have an acceptable commercial license status are returned.

### `GET /api/v1/catalog/{productId}`

Returns one customer-visible product and its configurable options.

### `GET /api/v1/catalog/categories`

Returns categories represented by the current customer-visible catalog.

## Authentication

### `POST /api/v1/auth/login`

Request:

```json
{"identifier":"customer@example.com","password":"..."}
```

Response contains a server session token and account summary. Password hashes and session records never belong in FabOS-Web.

### `POST /api/v1/auth/register`

Creates a customer account and returns the authenticated session token.

### `POST /api/v1/auth/logout`

Revokes the current authenticated session.

## Customer account

### `GET /api/v1/customer/me`

Returns the authenticated customer's customer record and account summary.

### `PATCH /api/v1/customer/me`

Updates customer-editable profile fields. The server remains authoritative for identity, account type, and customer linkage.

## Custom work

### `POST /api/v1/quote-requests`

Public endpoint for a first-time custom-work request. Accepts `name`, `email`, `project`, and optional file metadata. FabOS creates or reuses a customer record by email and creates the quote request through the existing quote service. No customer account or password is required just to request a quote.

Binary file upload is not yet part of the endpoint. The browser sends filename/type/size metadata only.

### `GET /api/v1/customer/quotes`

Returns only quotes belonging to the authenticated customer.

### `GET /api/v1/customer/quotes/{quoteId}`

Returns one quote and its items only when it belongs to the authenticated customer.

### `POST /api/v1/customer/quotes`

Authenticated quote submission for customers who already have accounts.

## Orders

### `GET /api/v1/customer/orders`

Returns only orders belonging to the authenticated customer.

### `GET /api/v1/customer/orders/{orderId}`

Returns one customer-owned order with customer-safe progress, items, totals, shipping information, and tracking information when available. Internal production jobs, printer information, staff notes, audit data, and other operational records must not be exposed.

### `POST /api/v1/customer/orders`

Accepts:

```json
{
  "items":[
    {
      "productId":"...",
      "variantId":"...",
      "quantity":1,
      "configuration":{}
    }
  ],
  "shippingAddress":{
    "address":"...",
    "city":"...",
    "state":"...",
    "zip":"..."
  },
  "notes":""
}
```

FabOS validates that every product is customer-eligible and every selected variant is active. The server calculates product pricing, tax, shipping, and the final total. The shipping address is stored with the order and the checkout channel is recorded as `customer-web`.

## Status mapping

FabOS currently maps internal order states to customer-safe labels:

- `new`, `pending`, `confirmed` → `Order received`
- `in_production` → `Preparing your order`
- `ready` → `Final quality check`
- `shipped` → `Shipping`
- `completed` → `Delivered`
- `cancelled` → `Cancelled`

The mapping belongs at the API boundary so internal workflow changes do not require customer UI changes.

## Security boundary

FabOS-Web must never be trusted as the source of truth for price, payment, customer ownership, order status, permissions, or fulfillment. The backend revalidates submitted identifiers, quantities, variants, totals, and customer relationships.

Payment processing is intentionally separate from order creation at this stage. The order workflow is server-backed now; a future payment provider integration can attach payment state without creating a second order system.
