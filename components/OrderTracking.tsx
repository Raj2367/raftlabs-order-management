'use client';

import { useState, useEffect, useRef } from 'react';
import type { OrderStatus } from '@/lib/orderStatusShared';
import { ORDER_STATUSES, rank } from '@/lib/orderStatus';

interface OrderTrackingProps {
  orderId: string;
  initialStatus: OrderStatus;
  pollIntervalMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 5000;

const STEP_LABELS: Record<OrderStatus, string> = {
  received: 'Received',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export default function OrderTracking({
  orderId,
  initialStatus,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: OrderTrackingProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchNext = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          if (cancelled) return;
          setConsecutiveFailures((f) => f + 1);
          scheduleNext();
          return;
        }
        const data = (await response.json()) as { status: OrderStatus };
        if (cancelled) return;
        setConsecutiveFailures(0);
        setStatus(data.status);
        if (data.status !== 'delivered') {
          scheduleNext();
        }
      } catch {
        if (cancelled) return;
        setConsecutiveFailures((f) => f + 1);
        scheduleNext();
      }
    };

    const scheduleNext = () => {
      timeoutRef.current = setTimeout(fetchNext, pollIntervalMs);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [orderId, pollIntervalMs]);

  const currentRank = rank(status);
  const showError = consecutiveFailures >= 3;

  return (
    <section aria-label="Order tracking" className="mt-8">
      <h2 className="text-xl font-semibold">Track Order</h2>
      <p className="mt-1">Order ID: {orderId}</p>

      {showError && (
        <div role="alert" className="text-red-600 mt-2">
          Unable to load order status. Please try again later.
        </div>
      )}

      <div role="status" className="mt-3">
        <span className="text-sm font-medium">
          Current status: {STEP_LABELS[status]}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {ORDER_STATUSES.map((step, idx) => {
          const isActive = idx <= currentRank;
          return (
            <li
              key={step}
              className={
                isActive
                  ? 'flex items-center text-green-700'
                  : 'flex items-center text-gray-400'
              }
            >
              <span
                className={
                  isActive
                    ? 'w-3 h-3 rounded-full bg-green-600 mr-2'
                    : 'w-3 h-3 rounded-full bg-gray-300 mr-2'
                }
              />
              <span>{STEP_LABELS[step]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
