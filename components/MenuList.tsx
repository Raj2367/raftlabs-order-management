'use client';

import { type MenuItem } from '@/lib/menu';

interface MenuListProps {
  items: MenuItem[];
  onAddToCart?: (id: string) => void;
}

export default function MenuList({ items, onAddToCart }: MenuListProps) {
  return (
    <section aria-label="Menu">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <li key={item.id}>
            <article className="bg-white rounded-lg shadow-md overflow-hidden p-4 h-full flex flex-col">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover rounded-md mb-4"
              />
              <h2 className="text-xl font-semibold">{item.name}</h2>
              <p className="text-gray-600 mt-2 flex-grow">{item.description}</p>
              <p className="text-lg font-bold mt-4">${item.price.toFixed(2)}</p>
              <button
                type="button"
                onClick={() => onAddToCart?.(item.id)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add to cart
              </button>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
