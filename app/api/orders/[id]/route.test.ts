import { describe, it, expect, beforeAll, beforeEach, inject } from 'vitest';
import { GET } from '@/app/api/orders/[id]/route';
import { Order } from '@/lib/models/Order';
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

describe('GET /api/orders/[id]', () => {
  beforeAll(async () => {
    await connect(inject('mongoUri'));
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  it('returns 200 with correct shape', async () => {
    const order = await Order.create({
      customer: validCustomer,
      items: [validItem],
      subtotal: 12.99,
    });

    const response = await GET(
      new Request('http://localhost/api/orders/' + order.id),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe(order.id);
    expect(body.customer).toEqual(validCustomer);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      menuItemId: '1',
      name: 'Margherita Pizza',
      price: 12.99,
      quantity: 1,
    });
    expect(body.subtotal).toBe(12.99);
    expect(body.status).toBe('received');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');
  });

  it('returns 400 for malformed id', async () => {
    const response = await GET(
      new Request('http://localhost/api/orders/invalid-id'),
      { params: Promise.resolve({ id: 'invalid-id' }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid order id');
  });

  it('returns 404 for valid but missing id', async () => {
    const fakeId = new Types.ObjectId().toString();

    const response = await GET(
      new Request('http://localhost/api/orders/' + fakeId),
      { params: Promise.resolve({ id: fakeId }) }
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Order not found');
  });

  it('returns derived status out_for_delivery when stored is received', async () => {
    const order = await Order.create({
      customer: validCustomer,
      items: [validItem],
      subtotal: 12.99,
    });

    await Order.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: new Date(Date.now() - 60_000) } }
    );

    const response = await GET(
      new Request('http://localhost/api/orders/' + order.id),
      { params: Promise.resolve({ id: order.id }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('out_for_delivery');

    const stored = await Order.findById(order.id);
    expect(stored!.status).toBe('received');
  });
});
