import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import {
  Order,
  ORDER_STATUSES,
  type OrderDoc,
  type OrderStatus,
} from '@/lib/models/Order';
import { connect } from '@/lib/mongodb';
import { toOrderResponse } from '@/lib/serializers';
import { nextStatus } from '@/lib/orderStatus';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    body === null ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const data = body as { status?: unknown };

  const validStatuses = ORDER_STATUSES as readonly string[];
  if (
    typeof data.status !== 'string' ||
    !validStatuses.includes(data.status)
  ) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  await connect();

  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const newStatus = data.status as OrderStatus;
  const expectedNext = nextStatus(order.status);
  if (expectedNext === null || newStatus !== expectedNext) {
    return NextResponse.json(
      {
        error: `Invalid transition from ${order.status} to ${newStatus}`,
      },
      { status: 400 }
    );
  }

  order.status = newStatus;
  await order.save();

  const doc = order.toObject() as OrderDoc & {
    _id: { toString: () => string };
  };

  return NextResponse.json(toOrderResponse(doc), { status: 200 });
}
