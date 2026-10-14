import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { Order, type OrderDoc } from '@/lib/models/Order';
import { connect } from '@/lib/mongodb';
import { toOrderResponse } from '@/lib/serializers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
  }

  await connect();

  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const doc = order.toObject() as OrderDoc & {
    _id: { toString: () => string };
  };

  return NextResponse.json(toOrderResponse(doc), { status: 200 });
}
