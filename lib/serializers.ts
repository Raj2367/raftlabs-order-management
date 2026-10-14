import type { OrderDoc, OrderItem } from '@/lib/models/Order';
import type { OrderStatus } from '@/lib/orderStatusShared';
import { effectiveStatus, deriveStatus } from '@/lib/orderStatus';

export interface OrderResponse {
  id: string;
  customer: { name: string; address: string; phone: string };
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export function toOrderResponse(
  doc: OrderDoc & { _id: { toString: () => string } }
): OrderResponse {
  return {
    id: doc._id.toString(),
    customer: {
      name: doc.customer.name,
      address: doc.customer.address,
      phone: doc.customer.phone,
    },
    items: doc.items.map((item) => ({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
    subtotal: doc.subtotal,
    status: effectiveStatus(doc.status, deriveStatus(doc.createdAt)),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
