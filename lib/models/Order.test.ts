import { describe, it, expect, beforeEach, inject } from 'vitest';
import { Order, ORDER_STATUSES, type OrderStatus } from '@/lib/models/Order';
import { connect } from '@/lib/mongodb';

describe('Order model', () => {
  beforeEach(async () => {
    const mongoUri = inject('mongoUri');
    await connect(mongoUri);
    await Order.deleteMany({});
  });

  describe('schema', () => {
    it('exposes the correct forward-only status sequence', () => {
      expect(ORDER_STATUSES).toEqual([
        'received',
        'preparing',
        'out_for_delivery',
        'delivered',
      ]);
    });

    it('defaults status to received', async () => {
      const order = new Order({
        customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
        items: [{ menuItemId: '1', name: 'Burger', price: 10, quantity: 1 }],
        subtotal: 10,
      });
      await order.save();
      expect(order.status).toBe('received');
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects empty items array', async () => {
      const order = new Order({
        customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
        items: [],
        subtotal: 0,
      });
      await expect(order.save()).rejects.toThrow(/at least one item/i);
    });

    it('rejects missing required customer fields', async () => {
      const order = new Order({
        customer: { name: '', address: '', phone: '' },
        items: [{ menuItemId: '1', name: 'Burger', price: 10, quantity: 1 }],
        subtotal: 10,
      });
      await expect(order.save()).rejects.toThrow(/required/i);
    });

    it('rejects negative subtotal', async () => {
      const order = new Order({
        customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
        items: [{ menuItemId: '1', name: 'Burger', price: 10, quantity: 1 }],
        subtotal: -5,
      });
      await expect(order.save()).rejects.toThrow(/subtotal/i);
    });

    it('rejects non-integer quantity', async () => {
      const order = new Order({
        customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
        items: [{ menuItemId: '1', name: 'Burger', price: 10, quantity: 1.5 }],
        subtotal: 15,
      });
      await expect(order.save()).rejects.toThrow(/integer/i);
    });

    it('rejects zero quantity', async () => {
      const order = new Order({
        customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
        items: [{ menuItemId: '1', name: 'Burger', price: 10, quantity: 0 }],
        subtotal: 0,
      });
      await expect(order.save()).rejects.toThrow(/quantity/i);
    });

    it('rejects invalid status value', async () => {
      const order = new Order({
        customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
        items: [{ menuItemId: '1', name: 'Burger', price: 10, quantity: 1 }],
        subtotal: 10,
        status: 'invalid' as OrderStatus,
      });
      await expect(order.save()).rejects.toThrow(/status/i);
    });
  });
});
