# FabOS customer API contract

This document defines the customer-facing HTTP boundary between FabOS-Web and the internal FabOS application. It is a contract, not a claim that these routes are currently live.

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

Response:

```json
{"products":[]}
```

### `GET /api/v1/catalog/{productId}`

Returns one customer-visible product and its configurable options.

### `GET /api/v1/catalog/categories`

Response:

```json
{"categories":[]}
```

## Authentication

### `POST /api/v1/auth/login`

Request:

```json
{"identifier":"customer@example.com","password":"..."}
```

Response contains a session token and account summary:

```json
{"token":"...","expires_at":"...","user":{}}
```

The server must authenticate against FabOS's existing account/session services. Password hashes and session records never belong in FabOS-Web.

### `POST /api/v1/auth/logout`

Revokes the current authenticated session.

## Customer account

### `GET /api/v1/customer/me`

Returns the authenticated customer's customer record and account summary.

### `PATCH /api/v1/customer/me`

Updates customer-editable profile fields. The server remains authoritative for identity, account type, and customer linkage.

## Quotes

### `GET /api/v1/customer/quotes`

Returns only quotes belonging to the authenticated customer. Optional `status` filter is supported.

### `GET /api/v1/customer/quotes/{quoteId}`

Returns one quote and its items only when it belongs to the authenticated customer.

### `POST /api/v1/customer/quotes`

Accepts the versioned `buildQuotePayload()` shape from `src/customer-contracts.js`. The server creates/links the customer and quote; pricing, quote number, status, expiration, and internal production estimates remain server-owned.

## Orders

### `GET /api/v1/customer/orders`

Returns only orders belonging to the authenticated customer. Optional `status` filter is supported.

### `GET /api/v1/customer/orders/{orderId}`

Returns one customer-owned order with customer-safe progress, items, totals, shipping/fulfillment information, and tracking data when available. Internal production jobs, printer information, staff notes, audit data, and other operational records must not be exposed.

### `POST /api/v1/customer/orders`

Accepts the versioned `buildOrderPayload()` shape from `src/customer-contracts.js`. The server is authoritative for customer linkage, pricing, taxes, shipping, payment state, order number, status, and fulfillment.

## Status mapping

FabOS currently has internal order states such as `pending`, `confirmed`, `in_production`, `ready`, `shipped`, `completed`, and `cancelled`. The customer API should map those internal states to the customer-safe timeline used by FabOS-Web:

1. Order received
2. Payment
3. Preparing your order
4. Final quality check
5. Shipping
6. Delivered

The mapping belongs at the API boundary so internal workflow changes do not require customer UI changes.

## Security boundary

FabOS-Web must never be trusted as the source of truth for price, payment, customer ownership, order status, permissions, or fulfillment. The backend must revalidate every submitted identifier, quantity, configuration, total, and customer relationship.

The current browser-local prototype remains valid until these routes are actually implemented and enabled. No frontend code should silently fall back from a failed authenticated API call to pretending a server operation succeeded.
