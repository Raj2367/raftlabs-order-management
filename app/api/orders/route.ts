import { NextResponse } from 'next/server';
import { Order, type OrderDoc, type OrderItem } from '@/lib/models/Order';
import { connect } from '@/lib/mongodb';
import { menuItems } from '@/lib/menu';

function countDigits(str: string): number {
  return (str.match(/\d/g) || []).length;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data = (body ?? {}) as {
    customer?: { name?: unknown; address?: unknown; phone?: unknown };
    items?: unknown;
  };

  const customer = data.customer ?? {};

  const name = typeof customer?.name === 'string' ? customer.name.trim() : '';
  if (name.length === 0) {
    return NextResponse.json({ error: 'customer.name is required' }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json(
      { error: 'customer.name must be 1-100 characters' },
      { status: 400 }
    );
  }

  const address = typeof customer?.address === 'string' ? customer.address.trim() : '';
  if (address.length === 0) {
    return NextResponse.json({ error: 'customer.address is required' }, { status: 400 });
  }
  if (address.length > 500) {
    return NextResponse.json(
      { error: 'customer.address must be 1-500 characters' },
      { status: 400 }
    );
  }

  const phone = typeof customer?.phone === 'string' ? customer.phone.trim() : '';
  if (phone.length === 0) {
    return NextResponse.json({ error: 'customer.phone is required' }, { status: 400 });
  }
  if (phone.length < 7 || phone.length > 20) {
    return NextResponse.json(
      { error: 'customer.phone must be 7-20 characters' },
      { status: 400 }
    );
  }
  if (countDigits(phone) < 7) {
    return NextResponse.json(
      { error: 'customer.phone must contain at least 7 digits' },
      { status: 400 }
    );
  }

  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'items must be a non-empty array' },
      { status: 400 }
    );
  }

  const orderItems: OrderItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json(
        { error: 'Each item must be an object' },
        { status: 400 }
      );
    }
    const record = item as Record<string, unknown>;
    const menuItemId =
      typeof record.menuItemId === 'string' ? record.menuItemId.trim() : '';
    if (!menuItemId) {
      return NextResponse.json(
        { error: 'Each item must have a valid menuItemId' },
        { status: 400 }
      );
    }
    const menuItem = menuItems.find((m) => m.id === menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { error: `MenuItem ${menuItemId} not found` },
        { status: 400 }
      );
    }
    const quantity = record.quantity;
    if (
      typeof quantity !== 'number' ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return NextResponse.json(
        { error: `Quantity must be an integer >= 1 for item ${menuItemId}` },
        { status: 400 }
      );
    }
    orderItems.push({
      menuItemId,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
    });
  }

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const roundedSubtotal = Math.round(subtotal * 100) / 100;

  await connect();

  const order = new Order({
    customer: { name, address, phone },
    items: orderItems,
    subtotal: roundedSubtotal,
  });

  const saved = await order.save();

  const doc = saved.toObject() as OrderDoc & {
    _id: { toString: () => string };
  };

  return NextResponse.json(
    {
      id: doc._id.toString(),
      customer: doc.customer,
      items: doc.items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: doc.subtotal,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}
