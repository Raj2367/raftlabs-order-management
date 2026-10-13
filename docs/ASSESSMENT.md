# Assessment Requirements

## Overview

A food-delivery order management application. The application allows customers to browse a
menu, build a cart, check out, place orders, and track order status through the delivery
lifecycle.

## Functional Requirements

### Menu Display

- Display menu items with **name**, **description**, **price**, and **image**.
- Menu data is static and typed (no admin/editable menu UI).

### Cart and Quantity Management

- Add items to the cart.
- Adjust item quantities (increase/decrease).
- Remove items from the cart.
- Display cart total.

### Checkout

- Collect customer details: **name**, **address**, and **phone number**.
- Validate all required fields before submission.
- Disable or prevent submission of invalid forms.

### Order Placement and Retrieval

- Submit the cart and customer details to create an order.
- Retrieve and view order details by order ID.
- Show a confirmation after order placement.

### Order Status

Status sequence (forward-only):

1. **received**
2. **preparing**
3. **out_for_delivery**
4. **delivered**

- Manual status updates must advance exactly one step.
- Reject unknown, backward, and skipped transitions.
- Optional: simulated real-time status updates derived from `createdAt`, using
  `effectiveStatus = max_by_rank(storedStatus, derivedStatus)`. The effective status must
  never regress.

### REST APIs

- `GET /api/menu` — return the static menu.
- `POST /api/orders` — create an order (cart + customer details).
- `GET /api/orders/:id` — retrieve an order by ID.
- `PATCH /api/orders/:id/status` — advance order status (one step forward only).

### Testing

- Test-Driven Development: unit, integration, and UI tests.
- Unit tests for order-status transition rules.
- Integration tests for database operations using an isolated test database.
- UI/component tests for cart, checkout, and tracking views.

### UI Framework

- React UI using Next.js (App Router).

### Optional Features

- Simulated real-time order status updates (polling from the client).

## Deliverables

- Public GitHub repository.
- Hosted application (e.g., Vercel).
- 12–15 minute Loom video walkthrough.

## Evaluation Criteria

- **Problem-solving**: approach to breaking down and solving the task.
- **Code quality**: clean, maintainable, well-structured code.
- **UI/UX**: polished, intuitive user experience.
- **Backend correctness**: robust, correct API design and data handling.
- **Effective AI-tool usage**: quality of outputs produced with AI assistance.
