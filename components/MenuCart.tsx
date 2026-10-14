'use client';

import { useState } from 'react';
import { type MenuItem } from '@/lib/menu';
import MenuList from '@/components/MenuList';
import CartPanel, { type CartEntry } from '@/components/CartPanel';
import CheckoutForm, { type OrderResponse } from '@/components/CheckoutForm';
import OrderConfirmation from '@/components/OrderConfirmation';
import OrderTracking from '@/components/OrderTracking';
import type { OrderStatus } from '@/lib/orderStatusShared';

interface MenuCartProps {
  items: MenuItem[];
}

export default function MenuCart({ items }: MenuCartProps) {
  const [cart, setCart] = useState<Record<string, CartEntry>>({});
  const [confirmation, setConfirmation] = useState<OrderResponse | null>(null);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  const addToCart = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setCart((prev) => {
      const existing = prev[id];
      if (existing) {
        return {
          ...prev,
          [id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [id]: {
          id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      };
    });
  };

  const increment = (id: string) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  const decrement = (id: string) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const remove = (id: string) => {
    setCart((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleSuccess = (order: OrderResponse) => {
    setConfirmation(order);
    setCart({});
  };

  const handleTrack = () => {
    if (confirmation) {
      setTrackingOrderId(confirmation.id);
    }
  };

  const entries = Object.values(cart);

  if (confirmation && !trackingOrderId) {
    return (
      <div>
        <MenuList items={items} onAddToCart={addToCart} />
        <OrderConfirmation order={confirmation} onTrack={handleTrack} />
      </div>
    );
  }

  if (confirmation && trackingOrderId) {
    return (
      <div>
        <MenuList items={items} onAddToCart={addToCart} />
        <OrderTracking
          orderId={trackingOrderId}
          initialStatus={confirmation.status as OrderStatus}
        />
      </div>
    );
  }

  return (
    <div>
      <MenuList items={items} onAddToCart={addToCart} />
      <CartPanel
        entries={entries}
        onIncrement={increment}
        onDecrement={decrement}
        onRemove={remove}
      />
      {entries.length > 0 && (
        <CheckoutForm entries={entries} onSuccess={handleSuccess} />
      )}
    </div>
  );
}
