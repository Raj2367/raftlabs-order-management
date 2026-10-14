export const ORDER_STATUSES = [
  'received',
  'preparing',
  'out_for_delivery',
  'delivered',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
