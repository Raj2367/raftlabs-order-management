import { type OrderResponse } from '@/components/CheckoutForm';

interface OrderConfirmationProps {
  order: OrderResponse;
}

export default function OrderConfirmation({ order }: OrderConfirmationProps) {
  return (
    <section aria-label="Order confirmation" className="mt-8">
      <h2 className="text-xl font-semibold">Order Confirmed!</h2>
      <p className="mt-2">Order ID: {order.id}</p>
      <p className="mt-1">Subtotal: ${order.subtotal.toFixed(2)}</p>
      <p className="mt-1">Status: {order.status}</p>
    </section>
  );
}
