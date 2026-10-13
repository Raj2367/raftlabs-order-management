import MenuList from '@/components/MenuList';
import { menuItems } from '@/lib/menu';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Order Management</h1>
      <MenuList items={menuItems} />
    </main>
  );
}
