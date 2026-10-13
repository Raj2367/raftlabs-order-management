export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic pizza with fresh mozzarella, tomato sauce, and basil',
    price: 12.99,
    image: '/menu/pizza.svg',
  },
  {
    id: '2',
    name: 'Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce',
    price: 9.99,
    image: '/menu/burger.svg',
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Fresh romaine lettuce with parmesan, croutons, and Caesar dressing',
    price: 8.50,
    image: '/menu/salad.svg',
  },
  {
    id: '4',
    name: 'Sushi Roll',
    description: 'Fresh tuna and avocado roll with pickled ginger and wasabi',
    price: 14.50,
    image: '/menu/sushi.svg',
  },
  {
    id: '5',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 7.25,
    image: '/menu/cake.svg',
  },
];
