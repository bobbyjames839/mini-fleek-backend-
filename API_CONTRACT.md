# Mini Fleek — Backend API Contract

This is the source of truth for the frontend. If something here disagrees with the code, the code is the bug.

- **Base URL (local):** `http://localhost:4000`
- **Base URL (prod):** _TBD — fill in once deployed._
- **Content-Type:** `application/json` for all requests with a body.
- **Auth:** Bearer token in `Authorization: Bearer <access_token>` header. The token is the `session.access_token` returned from `/auth/login` or `/auth/signup`.
- **CORS:** allows the configured `FRONTEND_ORIGIN` with credentials.
- **Money:** all prices are in **GBP minor units (pence)** as integers. e.g. `2499` = £24.99. The frontend formats for display.
- **IDs:** UUID strings unless otherwise noted.
- **Timestamps:** ISO 8601 UTC strings (e.g. `2026-05-10T14:32:00.000Z`).

---

## Error shape

Every non-2xx response uses this shape:

```json
{ "error": "Human-readable message." }
```

Validation errors may also include a `details` array:

```json
{ "error": "Invalid request.", "details": ["email is required", "password must be 8+ chars"] }
```

Common status codes:

| Code | Meaning |
|---|---|
| 400 | Bad request / validation failed |
| 401 | Missing or invalid bearer token |
| 403 | Authenticated but not allowed (e.g. another user's order) |
| 404 | Resource not found |
| 409 | Conflict (e.g. email already registered) |
| 503 | Auth/DB not configured |

---

## Health

### `GET /health`
Public. No auth.

**200**
```json
{ "status": "ok" }
```

---

## Auth

All three endpoints are public. Cart/order endpoints require the token returned here.

### `POST /auth/signup`

**Request**
```json
{ "email": "buyer@mailinator.com", "password": "hunter2hunter2" }
```

**201**
```json
{
  "user": { "id": "uuid", "email": "buyer@mailinator.com" },
  "session": {
    "access_token": "jwt...",
    "refresh_token": "...",
    "expires_in": 3600,
    "expires_at": 1746889200,
    "token_type": "bearer"
  }
}
```

> Note: if Supabase email confirmations are on, `session` may be `null` and the user must confirm via email before logging in.

**400** — missing fields, weak password, or email already registered (Supabase returns its own message).

### `POST /auth/login`

**Request**
```json
{ "email": "buyer@mailinator.com", "password": "hunter2hunter2" }
```

**200** — same shape as signup.
**401** — invalid credentials.

### `POST /auth/logout`

Requires bearer token. Revokes the refresh token at Supabase.

**Headers:** `Authorization: Bearer <access_token>`

**200**
```json
{ "success": true }
```

**401** — missing/invalid token.

---

## Categories

### `GET /categories`
Public. Used by homepage nav and category landing pages.

**200**
```json
{
  "categories": [
    { "id": "uuid", "name": "Vintage Tees", "slug": "vintage-tees", "image_url": "https://..." }
  ]
}
```

---

## Vendors

### `GET /vendors`
Public.

**200**
```json
{
  "vendors": [
    {
      "id": "uuid",
      "name": "Karachi Threads",
      "slug": "karachi-threads",
      "country": "PK",
      "rating": 4.7,
      "image_url": "https://..."
    }
  ]
}
```

---

## Products

### `GET /products`
Public. Listing endpoint with filters.

**Query params** (all optional):

| Param | Type | Notes |
|---|---|---|
| `category` | string (slug) | Filter to one category |
| `vendor` | string (slug) | Filter to one vendor |
| `q` | string | Search by name / brand (stretch) |
| `sort` | `newest` \| `price_asc` \| `price_desc` | Default: `newest` |
| `limit` | int (1–60) | Default 24 |
| `offset` | int | Default 0 |

**200**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Mixed 90s Graphic Tees Bundle",
      "slug": "mixed-90s-graphic-tees-bundle",
      "brand": "Mixed",
      "primary_photo": "https://...",
      "piece_count": 50,
      "total_price": 12500,
      "price_per_piece": 250,
      "original_total_price": 15000,
      "discount_pct": 17,
      "status": "active",
      "vendor": { "id": "uuid", "name": "Karachi Threads", "slug": "karachi-threads" },
      "category": { "id": "uuid", "name": "Vintage Tees", "slug": "vintage-tees" }
    }
  ],
  "total": 27,
  "limit": 24,
  "offset": 0
}
```

`original_total_price` and `discount_pct` are `null` when there's no discount.
`status` is one of `active` | `sold_out`.

### `GET /products/:id`
Public. Product detail page.

**200**
```json
{
  "product": {
    "id": "uuid",
    "name": "Mixed 90s Graphic Tees Bundle",
    "slug": "mixed-90s-graphic-tees-bundle",
    "description": "Long-form description.",
    "brand": "Mixed",
    "photos": ["https://...", "https://..."],
    "piece_count": 50,
    "total_price": 12500,
    "price_per_piece": 250,
    "original_total_price": 15000,
    "discount_pct": 17,
    "status": "active",
    "grade": "Grade A",
    "grading_breakdown": [
      { "grade": "AAA", "pct": 20 },
      { "grade": "AA",  "pct": 50 },
      { "grade": "A",   "pct": 30 }
    ],
    "brand_mix": [
      { "brand": "Hanes",            "pct": 30 },
      { "brand": "Fruit of the Loom","pct": 25 },
      { "brand": "Mixed",            "pct": 45 }
    ],
    "size_split": [
      { "size": "S",  "pct": 15 },
      { "size": "M",  "pct": 35 },
      { "size": "L",  "pct": 30 },
      { "size": "XL", "pct": 20 }
    ],
    "vendor": { "id": "uuid", "name": "Karachi Threads", "slug": "karachi-threads", "country": "PK", "rating": 4.7, "about": "Short bio." },
    "category": { "id": "uuid", "name": "Vintage Tees", "slug": "vintage-tees" }
  }
}
```

- `grade` is the headline badge (e.g. `Grade A`, `Premium`, `AAA`). Nullable.
- `grading_breakdown`, `brand_mix`, `size_split` are arrays of `{label, pct}` so the frontend can render rows in a stable order. All percentages sum to ~100. Any of them may be `null` if not provided.

**404** — no product with that id.

---

## Reviews

### `GET /reviews`
Public. Returns site-wide reviews (testimonials about Fleek as a whole — not tied to a product), newest first, plus a summary block.

**200**
```json
{
  "reviews": [
    {
      "id": "uuid",
      "reviewer_name": "Maya R.",
      "rating": 5,
      "title": "Grading is honest",
      "body": "Bundles arrive as described...",
      "created_at": "2026-05-10T14:32:00.000Z"
    }
  ],
  "summary": {
    "count": 8,
    "average_rating": 4.6
  }
}
```

- `rating` is an integer 1–5.
- `title` may be `null`.
- `summary.average_rating` is rounded to one decimal place across all reviews, or `null` when `count === 0`.

---

## AI

### `POST /products/search`
Public. Natural-language product search. The backend pulls the full active catalogue, hands it to OpenAI (`OPENAI_API_KEY` required; default model `gpt-4o-mini`, override via `OPENAI_MODEL`) along with the buyer's query, and the model returns the matching product IDs in best-fit order. Those IDs are then hydrated from the database and returned. There is no intermediate structured filter — the model sees real product copy (name, brand, description, grade, prices, vendor, category) and decides directly.

**Request**
```json
{
  "query": "Show me Y2K denim bundles under £8 per piece from European vendors, grade A only.",
  "limit": 24
}
```

- `query` is required, trimmed, capped at 300 characters.
- `limit` is optional, clamped to 1–60, defaults to 24.

**200**
```json
{
  "query": "Show me Y2K denim bundles under £8 per piece from European vendors, grade A only.",
  "products": [ /* product summary shape, same as GET /products */ ],
  "total": 3,
  "limit": 24
}
```

- `products` are returned in the order the AI ranked them (best match first).
- `total` is the number of products in this response (already capped at `limit`). There is no separate "matched but truncated" count.
- IDs the model returns that aren't in the live catalogue are dropped before hydration.
- `products` items are the same shape as `GET /products` (with `vendor.country` included).
- The previous `parsed` field (structured filter) has been removed — the model picks products directly from the catalogue, so there is nothing intermediate to expose.

**400** — missing/empty `query`.
**502** — OpenAI could not produce a valid response for this query.
**503** — `OPENAI_API_KEY` or Supabase not configured.

---

## Cart

All cart endpoints **require auth**. The cart is auto-scoped to the authenticated user — there is no `cartId` in the path.

A cart line item's `quantity` is the **number of bundles**, not pieces.

### `GET /cart`

**200**
```json
{
  "cart": {
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Mixed 90s Graphic Tees Bundle",
          "slug": "mixed-90s-graphic-tees-bundle",
          "primary_photo": "https://...",
          "piece_count": 50,
          "price_per_piece": 250,
          "vendor": { "name": "Karachi Threads", "slug": "karachi-threads" }
        },
        "quantity": 2,
        "unit_price": 12500,
        "line_total": 25000
      }
    ],
    "subtotal": 25000,
    "item_count": 2
  }
}
```

Empty cart returns `items: []`, `subtotal: 0`, `item_count: 0`.

### `POST /cart/items`
Add a bundle to the cart. If the product is already in the cart, the quantity is incremented.

**Request**
```json
{ "product_id": "uuid", "quantity": 1 }
```

`quantity` defaults to `1` if omitted. Must be ≥ 1.

**200** — returns the full cart (same shape as `GET /cart`).
**400** — invalid quantity, missing product_id, product is `sold_out`.
**404** — product doesn't exist.

### `PATCH /cart/items/:itemId`
Set the quantity of a line item.

**Request**
```json
{ "quantity": 3 }
```

`quantity` ≥ 1. To remove, use DELETE.

**200** — returns full cart.
**404** — item doesn't belong to this user's cart.

### `DELETE /cart/items/:itemId`

**200** — returns full cart.
**404** — item doesn't belong to this user's cart.

---

## Checkout & Orders

### `POST /checkout`
Requires auth. Places an order from the current cart, then clears the cart. No real payment.

**Request**
```json
{
  "shipping_address": {
    "full_name": "Alex Buyer",
    "line1": "12 Brick Lane",
    "line2": null,
    "city": "London",
    "postcode": "E1 6RF",
    "country": "GB"
  }
}
```

All address fields are required strings except `line2` (nullable).

**201**
```json
{ "order": { /* full Order shape, see GET /orders/:id */ } }
```

**400** — empty cart, missing address fields.

### `GET /orders`
Requires auth. The current user's orders, newest first. Paginated.

**Query params**
- `limit` — optional, 1–60, defaults to 20.
- `offset` — optional, ≥ 0, defaults to 0.

**200**
```json
{
  "orders": [
    {
      "id": "uuid",
      "status": "placed",
      "subtotal": 25000,
      "total": 25000,
      "item_count": 2,
      "created_at": "2026-05-10T14:32:00.000Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

- `total` is the user's total order count (not just this page).
- `status` is one of `placed` | `shipped` | `cancelled`. v0 only ever creates `placed`.

### `GET /orders/:id`
Requires auth. 403 if the order belongs to another user.

**200**
```json
{
  "order": {
    "id": "uuid",
    "status": "placed",
    "created_at": "2026-05-10T14:32:00.000Z",
    "shipping_address": {
      "full_name": "Alex Buyer",
      "line1": "12 Brick Lane",
      "line2": null,
      "city": "London",
      "postcode": "E1 6RF",
      "country": "GB"
    },
    "items": [
      {
        "id": "uuid",
        "product_id": "uuid",
        "product_name": "Mixed 90s Graphic Tees Bundle",
        "product_slug": "mixed-90s-graphic-tees-bundle",
        "primary_photo": "https://...",
        "vendor_name": "Karachi Threads",
        "piece_count": 50,
        "quantity": 2,
        "unit_price": 12500,
        "line_total": 25000
      }
    ],
    "subtotal": 25000,
    "total": 25000
  }
}
```

Order line items are **snapshots** — they keep the price/name/photo at the time the order was placed, even if the product later changes.

**404** — no such order.
**403** — order exists but belongs to a different user.

---

## Conventions for the frontend

- Always send `Authorization: Bearer <access_token>` on cart/order/checkout requests. A 401 means the token is missing or expired — kick the user back to login.
- Treat `error` strings as user-displayable but generic — don't parse them.
- All money is integer pence; never do float math on the client.
- For list endpoints, expect `{ items, total, limit, offset }` so pagination is easy to add later.

## Status

| Endpoint | Status |
|---|---|
| `POST /auth/signup` | ✅ implemented |
| `POST /auth/login` | ✅ implemented |
| `POST /auth/logout` | ✅ implemented |
| `GET /categories` | ✅ implemented |
| `GET /vendors` | ✅ implemented |
| `GET /products` | ✅ implemented |
| `GET /products/:id` | ✅ implemented |
| `GET /reviews` | ✅ implemented |
| `POST /products/search` | ✅ implemented |
| `GET /cart` | ✅ implemented |
| `POST /cart/items` | ✅ implemented |
| `PATCH /cart/items/:itemId` | ✅ implemented |
| `DELETE /cart/items/:itemId` | ✅ implemented |
| `POST /checkout` | ✅ implemented |
| `GET /orders` | ✅ implemented |
| `GET /orders/:id` | ✅ implemented |
