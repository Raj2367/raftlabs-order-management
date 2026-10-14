import { describe, it, expect, beforeAll, beforeEach, inject } from 'vitest';
import { PATCH } from '@/app/api/orders/[id]/status/route';
import { Order, type OrderStatus } from '@/lib/models/Order';
import { connect } from '@/lib/mongodb';
import { Types } from 'mongoose';

const validCustomer = {
  name: 'John Doe',
  address: '123 Main St',
  phone: '555-0123',
};

const validItem = {
  menuItemId: '1',
  name: 'Margherita Pizza',
  price: 12.99,
  quantity: 1,
};

async function createOrder(status?: OrderStatus) {
  return Order.create({
    customer: validCustomer,
    items: [validItem],
    subtotal: 12.99,
    ...(status ? { status } : {}),
  });
}

describe('PATCH /api/orders/[id]/status', () => {
  beforeAll(async () => {
    await connect(inject('mongoUri'));
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  it('returns 200 and advances received → preparing', async () => {
    const order = await createOrder();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('preparing');
  });

  it('returns 400 on skipped transition (received → out_for_delivery)', async () => {
    const order = await createOrder();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'out_for_delivery' }),
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('returns 400 on backward transition (preparing → received)', async () => {
    const order = await createOrder('preparing');

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'received' }),
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('returns 400 on no-op (delivered → delivered)', async () => {
    const order = await createOrder('delivered');

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('returns 400 on invalid status value', async () => {
    const order = await createOrder();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'invalid_status' }),
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('returns 400 when body is JSON null', async () => {
    const order = await createOrder();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: 'null',
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid status');
  });

  it('returns 400 when body is an array', async () => {
    const order = await createOrder();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: '[]',
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid status');
  });

  it('returns 404 for missing valid id', async () => {
    const fakeId = new Types.ObjectId().toString();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + fakeId, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      }),
      { params: Promise.resolve({ id: fakeId }) }
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Order not found');
  });

  it('persists status change after successful PATCH', async () => {
    const order = await createOrder();

    const response = await PATCH(
      new Request('http://localhost/api/orders/' + order.id, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'preparing' }),
      }),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(200);

    const stored = await Order.findById(order.id);
    expect(stored!.status).toBe('preparing');
  });
});
