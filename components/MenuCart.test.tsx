import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuCart from '@/components/MenuCart';
import { menuItems } from '@/lib/menu';

describe('MenuCart', () => {
  it('adds an item to the cart when Add to cart is clicked', () => {
    render(<MenuCart items={menuItems} />);
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addButtons[0]);
    expect(screen.getByText('Total items: 1')).toBeInTheDocument();
  });

  it('increases quantity when increment is clicked', () => {
    render(<MenuCart items={menuItems} />);
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addButtons[0]);
    const incrementButton = screen.getByRole('button', {
      name: /increment margherita pizza/i,
    });
    fireEvent.click(incrementButton);
    expect(screen.getByText('Total items: 2')).toBeInTheDocument();
  });

  it('removes an item when decrementing to zero', () => {
    render(<MenuCart items={menuItems} />);
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addButtons[0]);
    const decrementButton = screen.getByRole('button', {
      name: /decrement margherita pizza/i,
    });
    fireEvent.click(decrementButton);
    expect(screen.getByText('Total items: 0')).toBeInTheDocument();
  });

  it('calculates subtotal as sum of line totals for multiple items', () => {
    render(<MenuCart items={menuItems} />);
    const addButtons = screen.getAllByRole('button', { name: /add to cart/i });
    fireEvent.click(addButtons[0]);
    fireEvent.click(addButtons[1]);
    expect(screen.getByText('Subtotal: $22.98')).toBeInTheDocument();
  });
});
