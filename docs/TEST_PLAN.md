# Test Plan

## Unit

- **`lib/menu.test.ts`** — asserts `menuItems` is an array. (1 test, passing)
- **`lib/mongodb.test.ts`** — `getMongoUri` throws when `MONGODB_URI` is
  missing or empty and returns it when set (3 tests); `connect` establishes
  a connection using the provided URI, caches it on the second call, and
  falls back to `getMongoUri` when no URI is passed (3 tests); `disconnect`
  clears the cache so a subsequent `connect` succeeds (1 test).
  (7 tests, passing)
- **`lib/models/Order.test.ts`** — schema validation: correct forward-only
  status sequence, default `received` status, `createdAt`/`updatedAt`
  timestamps, rejects empty items array, missing customer fields, negative
  subtotal, non-integer quantity, zero quantity, and invalid status enum
  value. (8 tests, passing)
- **`lib/orderStatus.test.ts`** — `rank` returns 0..3 in declared order; `nextStatus`
  advances one step forward and returns null at `delivered`; `deriveStatus` returns
  each status at the exact boundary times (0ms, 15_000ms, 45_000ms, 90_000ms);
  `effectiveStatus` returns the higher rank, returns stored on tie, and returns stored
  when derived is behind. (10 tests)
- Menu helper utilities (to be added): type validation, price calculations.

## Integration

- MongoDB in-memory server pinned to binary `7.0.14`, started via Vitest
  `globalSetup`, URI shared with tests via `provide`/`inject` mechanism.
- Connection helper verified against a live in-memory MongoDB instance:
  cached connection reuse and `disconnect` cache-clearing.
- Order model schema validation tested against the live in-memory MongoDB
  instance; collections cleaned in `beforeEach` via `Order.deleteMany({})`.

## API (Route Handler)

- **`app/api/health/route.test.ts`** — `GET /api/health` returns HTTP 200
  with `{ "status": "ok" }`. (1 test, passing)
- **`app/api/menu/route.test.ts`** — `GET /api/menu` returns the `menuItems`
  array from `lib/menu` and confirms the result is an array. (2 tests, passing)
- Order API (`POST /api/orders`): validates customer fields (name,
  address, phone), items (non-empty, valid menuItemId, integer quantity >= 1),
  rejects client-supplied price/name/subtotal/status, computes subtotal server-side,
  returns 201 with normalized order or 400 with error message on failure;
  malformed JSON returns 400 with `{"error":"Invalid JSON"}`. (8 tests, passing)
- **`app/api/orders/[id]/route.test.ts`** — `GET /api/orders/[id]` returns 200 with the
  serialized order shape; 400 for a malformed id; 404 for a valid but missing id; and
  returns derived `out_for_delivery` status when `createdAt` is 60s in the past while
  the stored status remains `received`. (4 tests)
- **`app/api/orders/[id]/status/route.test.ts`** — `PATCH /api/orders/[id]/status`
  returns 200 and advances `received` → `preparing`; 400 on skipped transition
  (`received` → `out_for_delivery`); 400 on backward transition (`preparing` → `received`);
  400 on no-op (`delivered` → `delivered`); 400 on invalid status value; 400 when body is
  JSON `null` or an array; 404 for a missing valid id; and persists the status change
  after a successful PATCH. (9 tests)

## UI (Component)

- **`components/MenuList.test.tsx`** — renders the correct number of items
  (matches `menuItems.length`), every item name is present, and every item
  formatted price (`$${price.toFixed(2)}`) is present. (3 tests, passing)
- **`components/MenuCart.test.tsx`** — adding an item to the cart (total items
  increments), increasing quantity (total items increments), decrementing to
  zero (item removed from cart), and two-item subtotal equals sum of line
  totals. (4 tests, passing)
- **`components/CheckoutForm.test.tsx`** — empty fields prevent submission
  and show `Required`; valid submission calls `fetch` once with the correct URL,
  method, headers, and exact JSON body; API 400 shows error and preserves cart;
  API 201 calls `onSuccess` with the returned order (ID and subtotal); network
  rejection shows `Unable to place order`. (5 tests, passing)
- **`components/OrderTracking.test.tsx`** — `vi.spyOn(global, 'fetch')` with
  `vi.useFakeTimers()` (pollIntervalMs=100); `afterEach` restores timers and mocks.
  Cases: fetches once after mount + interval; status advances across polls
  (`received` → `preparing` → `out_for_delivery`); polling stops after `delivered`;
  unmount clears pending timeout (no fetch after unmount); single failed poll retains
  last status with no error; three consecutive failures render a `role="alert"`. (6 tests)
- Order tracking view: displays current status and polls for updates while
  active. (added in Step 6B)

## End-to-End

- Full flow: browse menu → add to cart → adjust quantities → checkout → view
  confirmation → track status updates. — to be added in a later stage.
- Status panel: advancing status requires exactly one step; invalid
  transitions are rejected at the API level. — to be added in a later stage.

## Release Checks

- `npm run typecheck` passes with zero errors.
- `npm run lint` passes with no warnings.
- `npm run build` completes successfully.
- All tests pass (`npm test`).
- Application starts and `GET /` returns HTTP 200.
- `GET /api/health` returns 200 with `{ "status": "ok" }`.
- `GET /api/menu` returns 200 with the static menu array.

## Current Results

- **71 passed, 0 failed, 0 skipped** across 13 test files.
