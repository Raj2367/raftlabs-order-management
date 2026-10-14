'use client';

import { useState, type FormEvent } from 'react';
import { type CartEntry } from '@/components/CartPanel';

export interface OrderResponse {
  id: string;
  customer: { name: string; address: string; phone: string };
  items: { menuItemId: string; name: string; price: number; quantity: number }[];
  subtotal: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CheckoutFormProps {
  entries: CartEntry[];
  onSuccess: (order: OrderResponse) => void;
}

export default function CheckoutForm({ entries, onSuccess }: CheckoutFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const nameValid = name.trim().length > 0;
  const addressValid = address.trim().length > 0;
  const phoneValid = phone.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!nameValid || !addressValid || !phoneValid) {
      setError('');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            address: address.trim(),
            phone: phone.trim(),
          },
          items: entries.map((entry) => ({
            menuItemId: entry.id,
            quantity: entry.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error ?? 'Unable to place order');
        return;
      }

      const order = (await response.json()) as OrderResponse;
      onSuccess(order);
    } catch {
      setError('Unable to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Checkout form" className="mt-8">
      <div className="mb-4">
        <label htmlFor="checkout-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="checkout-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {!nameValid && <span className="text-red-600 text-sm">Required</span>}
      </div>
      <div className="mb-4">
        <label htmlFor="checkout-address" className="block text-sm font-medium">
          Address
        </label>
        <input
          id="checkout-address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {!addressValid && <span className="text-red-600 text-sm">Required</span>}
      </div>
      <div className="mb-4">
        <label htmlFor="checkout-phone" className="block text-sm font-medium">
          Phone
        </label>
        <input
          id="checkout-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
        />
        {!phoneValid && <span className="text-red-600 text-sm">Required</span>}
      </div>
      {error && (
        <div role="alert" className="text-red-600 mb-4">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  );
}
