import { Schema, model, models, type Model } from 'mongoose';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/orderStatusShared';

export { ORDER_STATUSES, type OrderStatus };

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDoc {
  customer: {
    name: string;
    address: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<OrderItem>(
  {
    menuItemId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: [0, 'Price must be non-negative'] },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: (v: number) => Number.isInteger(v),
        message: 'Quantity must be an integer',
      },
    },
  },
  { _id: false }
);

const orderSchema = new Schema<OrderDoc>(
  {
    customer: {
      name: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    items: {
      type: [itemSchema],
      required: true,
      validate: {
        validator: (v: OrderItem[]) => Array.isArray(v) && v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    subtotal: { type: Number, required: true, min: [0, 'Subtotal must be non-negative'] },
    status: {
      type: String,
      enum: [...ORDER_STATUSES],
      default: 'received',
      required: true,
    },
  },
  { timestamps: true }
);

export const Order: Model<OrderDoc> = models.Order ?? model<OrderDoc>('Order', orderSchema);
