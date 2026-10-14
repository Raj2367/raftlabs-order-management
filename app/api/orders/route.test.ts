import { describe, it, expect, beforeAll, beforeEach, inject } from 'vitest';
import { POST } from '@/app/api/orders/route';
import { Order } from '@/lib/models/Order';
import { connect } from '@/lib/mongodb';

const validCustomer = { name: 'John Doe', address: '123 Main St', phone: '555-0123' };

describe('POST /api/orders', () => {
  beforeAll(async () => {
    await connect(inject('mongoUri'));
  });

  beforeEach(async () => {
    await Order.deleteMany({});
  });

  it('returns 201 with correct shape for a valid request', async () => {
    const payload = {
      customer: validCustomer,
      items: [
        { menuItemId: '1', quantity: 1 },
        { menuItemId: '2', quantity: 1 },
      ],
    };

    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTypeOf('string');
    expect(body.customer).toEqual(payload.customer);
    expect(body.items).toHaveLength(2);
    expect(body.items[0]).toMatchObject({
      menuItemId: '1',
      name: 'Margherita Pizza',
      price: 12.99,
      quantity: 1,
    });
    expect(body.items[1]).toMatchObject({
      menuItemId: '2',
      name: 'Burger',
      price: 9.99,
      quantity: 1,
    });
    expect(body.subtotal).toBe(22.98);
    expect(body.status).toBe('received');
    expect(body.createdAt).toBeTypeOf('string');
    expect(body.updatedAt).toBeTypeOf('string');
  });

  it('rejects missing customer.name with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: { address: validCustomer.address, phone: validCustomer.phone },
          items: [{ menuItemId: '1', quantity: 1 }],
        }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('rejects missing customer.address with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: { name: validCustomer.name, phone: validCustomer.phone },
          items: [{ menuItemId: '1', quantity: 1 }],
        }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('rejects invalid customer.phone with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: { name: validCustomer.name, address: validCustomer.address, phone: 'abc' },
          items: [{ menuItemId: '1', quantity: 1 }],
        }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('rejects empty items array with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: validCustomer,
          items: [],
        }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('rejects unknown menuItemId with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: validCustomer,
          items: [{ menuItemId: '999', quantity: 1 }],
        }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('rejects quantity: 0 with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: validCustomer,
          items: [{ menuItemId: '1', quantity: 0 }],
        }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTypeOf('string');
  });

  it('rejects malformed JSON body with 400', async () => {
    const response = await POST(
      new Request('http://localhost/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not valid json',
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid JSON');
  });
});
