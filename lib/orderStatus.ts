import { ORDER_STATUSES, type OrderStatus } from '@/lib/orderStatusShared';

export { ORDER_STATUSES, type OrderStatus };

export const STATUS_THRESHOLDS_MS = {
  preparing: 15_000,
  out_for_delivery: 45_000,
  delivered: 90_000,
} as const;

export function rank(status: OrderStatus): number {
  return ORDER_STATUSES.indexOf(status);
}

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUSES.indexOf(current);
  if (idx === -1 || idx === ORDER_STATUSES.length - 1) {
    return null;
  }
  return ORDER_STATUSES[idx + 1];
}

export function deriveStatus(createdAt: Date, now: Date = new Date()): OrderStatus {
  const elapsed = now.getTime() - createdAt.getTime();

  if (elapsed < STATUS_THRESHOLDS_MS.preparing) {
    return 'received';
  }
  if (elapsed < STATUS_THRESHOLDS_MS.out_for_delivery) {
    return 'preparing';
  }
  if (elapsed < STATUS_THRESHOLDS_MS.delivered) {
    return 'out_for_delivery';
  }
  return 'delivered';
}

export function effectiveStatus(
  stored: OrderStatus,
  derived: OrderStatus
): OrderStatus {
  if (rank(derived) > rank(stored)) {
    return derived;
  }
  return stored;
}
