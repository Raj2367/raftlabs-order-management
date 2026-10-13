'use client';

export type CartEntry = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

interface CartPanelProps {
  entries: CartEntry[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function CartPanel({
  entries,
  onIncrement,
  onDecrement,
  onRemove,
}: CartPanelProps) {
  const itemCount = entries.reduce((sum, e) => sum + e.quantity, 0);
  const subtotal = entries.reduce(
    (sum, e) => sum + e.price * e.quantity,
    0
  );

  return (
    <aside aria-label="Shopping cart" className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Cart</h2>
      <p className="text-sm text-gray-600 mb-4">Total items: {itemCount}</p>
      <p className="text-lg font-bold mb-4">Subtotal: ${subtotal.toFixed(2)}</p>
      {entries.length === 0 ? (
        <p className="text-gray-500">The cart is empty.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="border-b pb-3">
              <h3 className="font-semibold">{entry.name}</h3>
              <p className="text-sm text-gray-600">
                Unit price: ${entry.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Quantity: {entry.quantity}</p>
              <p className="text-sm text-gray-600">
                Line total: ${(entry.price * entry.quantity).toFixed(2)}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onIncrement(entry.id)}
                  aria-label={`Increment ${entry.name}`}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => onDecrement(entry.id)}
                  aria-label={`Decrement ${entry.name}`}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  aria-label={`Remove ${entry.name}`}
                  className="px-2 py-1 bg-red-600 text-white rounded"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
