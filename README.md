# Order Management

A food-delivery order management application built with Next.js 14, TypeScript, and Tailwind CSS.

Customers browse a static menu, build a shopping cart, check out with customer details, place orders, and track order status through a forward-only delivery lifecycle.

## Features

- **Menu display** — browse static, typed menu items with name, price, and image.
- **Cart management** — add items, adjust quantities (increase/decrease), remove items, and view live totals.
- **Checkout** — collect customer name, delivery address, and phone number with inline validation.
- **Order creation** — validate input and create orders with server-side price and subtotal calculation.
- **Order confirmation** — display order ID, subtotal, and initial status after placement.
- **Order tracking** — poll the order endpoint to observe status progression with retry-on-failure semantics.
- **Status lifecycle** — forward-only transitions enforced at the API level; effective status derived on read.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Runtime | Node.js 20 LTS |
| UI | React 18, Tailwind CSS 3 |
| Language | TypeScript 5 |
| Database | MongoDB via Mongoose 9 |
| Testing | Vitest 2, Testing Library, jsdom |
| Linting | ESLint (eslint-config-next) |

## Prerequisites

- **Node.js 20 LTS** — the project pins Node to major version 20 in `.nvmrc`.
- **npm**
- **MongoDB** — a running instance is required for order operations (see [Local Setup](#local-setup)).

If `nvm` is available, activate the correct version before installing:

```bash
nvm use
```

## Local Setup

```bash
nvm use
npm install
npm run dev
```

The application starts at [http://localhost:3000](http://localhost:3000).

### Environment Configuration

Order endpoints require a MongoDB connection string. Copy the template and configure it locally:

```bash
cp .env.example .env.local
# Edit .env.local and set:
# MONGODB_URI=mongodb+srv://...
```

`.env.example` ships with an empty `MONGODB_URI` placeholder. **Never commit real credentials.**

### Database Requirement

- **`GET /api/health`** and **`GET /api/menu`** work without a database connection — they serve static/synthetic responses.
- **Order creation** (`POST /api/orders`) and **order-specific endpoints** (`GET /api/orders/:id`, `PATCH /api/orders/:id/status`) require a valid MongoDB connection.

You can start the app and browse the menu before configuring MongoDB, but you must set `MONGODB_URI` before testing order operations.

## Testing and Type Checking

| Command | Description |
| --- | --- |
| `npm test` | Run the test suite once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | ESLint |

All three checks must pass before a change is considered complete:

```bash
npm run typecheck && npm run lint && npm test
```

## Documentation

- [**docs/ASSESSMENT.md**](docs/ASSESSMENT.md) — original assessment scope and requirements.
- [**docs/TEST_PLAN.md**](docs/TEST_PLAN.md) — current test coverage and results (71 tests across 13 files).

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check — returns `{"status":"ok"}` |
| GET | `/api/menu` | Retrieve the static menu items array |
| POST | `/api/orders` | Validate customer and item data, compute subtotal, create an order |
| GET | `/api/orders/:id` | Retrieve a specific order with its effective status |
| PATCH | `/api/orders/:id/status` | Advance the stored order status (one step forward only) |

### POST `/api/orders`

- **Customer**: `name` (1–100 chars), `address` (1–500 chars), `phone` (7–20 chars, at least 7 digits) — all required.
- **Items**: non-empty array; each item requires a valid `menuItemId` (must exist in the menu) and an integer `quantity` ≥ 1.
- **Server-side computation**: item `price` and order `subtotal` are calculated from the menu — client-supplied values are ignored.
- `status` is always set to `received` on creation.
- **Success**: 201 with the serialized order.
- **Error**: 400 with `{"error":"<message>"}`; malformed JSON returns 400 with `{"error":"Invalid JSON"}`.

### GET `/api/orders/:id`

- **Success**: 200 with the serialized order, including the **effective status** (see [Status Lifecycle](#status-lifecycle)).
- **400**: `{"error":"Invalid order id"}` when the path parameter is not a valid MongoDB ObjectId.
- **404**: `{"error":"Order not found"}` when no order matches a valid id.

### PATCH `/api/orders/:id/status`

- **Body**: `{"status":"<OrderStatus>"}` where the value must be one of `received`, `preparing`, `out_for_delivery`, `delivered`.
- **400**: invalid body (null, array, missing/invalid `status`), invalid ObjectId, or an invalid transition.
- **404**: order not found.
- **Valid transitions**: the new status must be exactly one step ahead of the current stored status (`nextStatus`). Skipped, backward, and no-op transitions are rejected with 400.
- **Success**: 200 with the updated serialized order.

## Order Status Lifecycle

```
received → preparing → out_for_delivery → delivered
```

Transitions are strictly forward; each `PATCH` must advance exactly one step.

### Thresholds

Status is also **derived from elapsed time** since order creation:

| Threshold (ms) | Derived Status |
|---|---|
| < 15,000 | `received` |
| 15,000–44,999 | `preparing` |
| 45,000–89,999 | `out_for_delivery` |
| ≥ 90,000 | `delivered` |

These thresholds are defined in `lib/orderStatus.ts` (`STATUS_THRESHOLDS_MS`).

### Effective Status

When an order is read (via `GET /api/orders/:id` or the confirmation/tracking UI), the response returns:

```
effectiveStatus = max_by_rank(storedStatus, derivedStatus)
```

- If the time-derived status ranks **higher** than the stored status, the derived value is returned.
- If the stored status is equal to or higher than the derived value, the stored status is returned.
- The effective status **never regresses**.

Stored status is advanced explicitly and manually via `PATCH /api/orders/:id/status` (forward-only). No background worker or scheduled job updates statuses automatically.

The API and UI show the **effective status** (`max_by_rank(stored, time-derived)`), while MongoDB stores the **stored status**, which changes only through `PATCH /api/orders/:id/status`. Atlas will often show a lower status than the tracking UI; this is intentional.

The **order tracking view** (`OrderTracking` component) polls `GET /api/orders/:id` at a configurable interval (default 5,000 ms) using `setTimeout` — it does not use `setInterval`, and it stops polling once the effective status reaches `delivered`. This is **client-side polling, not server-pushed real-time updates**.

## Limitations and Deployment

**Known limitations** (no fixes planned in the current stage):

- **No authentication** — all endpoints are publicly accessible.
- **No payment processing** — subtotal is computed for display only; no real payments are integrated.
- **No server-pushed updates** — status changes are observed via client-side polling, not WebSocket or SSE.
- **No deployment** — the assessment calls for a hosted application (e.g., Vercel), but deployment is not yet configured or completed. There is no live URL to access.

## Development Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Lint with ESLint
npm run typecheck # Type-check with tsc
npm test         # Run tests once
npm run test:watch # Watch mode
```
