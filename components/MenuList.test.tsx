import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuList from '@/components/MenuList';
import { menuItems } from '@/lib/menu';

describe('MenuList', () => {
  it('renders the correct number of items', () => {
    render(<MenuList items={menuItems} />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(menuItems.length);
  });

  it('renders every item name', () => {
    render(<MenuList items={menuItems} />);
    menuItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });

  it('renders every item formatted price', () => {
    render(<MenuList items={menuItems} />);
    menuItems.forEach((item) => {
      const formattedPrice = `$${item.price.toFixed(2)}`;
      expect(screen.getByText(formattedPrice)).toBeInTheDocument();
    });
  });
});
