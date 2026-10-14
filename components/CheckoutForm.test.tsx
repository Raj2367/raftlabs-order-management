import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CheckoutForm, { type OrderResponse } from '@/components/CheckoutForm';
import { type CartEntry } from '@/components/CartPanel';

const cartEntries: CartEntry[] = [
  { id: '1', name: 'Margherita Pizza', price: 12.99, quantity: 1 },
  { id: '2', name: 'Burger', price: 9.99, quantity: 1 },
];

const validCustomer = {
  name: 'John Doe',
  address: '123 Main St',
  phone: '555-0123',
};

const orderResponse: OrderResponse = {
  id: 'order123',
  customer: { name: 'John Doe', address: '123 Main St', phone: '555-0123' },
  items: [
    { menuItemId: '1', name: 'Margherita Pizza', price: 12.99, quantity: 1 },
    { menuItemId: '2', name: 'Burger', price: 9.99, quantity: 1 },
  ],
  subtotal: 22.98,
  status: 'received',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('CheckoutForm', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prevents submission and shows Required when fields are empty', () => {
    const onSuccess = vi.fn<(order: OrderResponse) => void>();
    render(<CheckoutForm entries={cartEntries} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(global.fetch).not.toHaveBeenCalled();
    expect(screen.getAllByText('Required')).toHaveLength(3);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('submits with correct URL, method, headers, and exact JSON body', async () => {
    const onSuccess = vi.fn<(order: OrderResponse) => void>();
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(orderResponse), { status: 201 })
    );

    render(<CheckoutForm entries={cartEntries} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: validCustomer.name },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: validCustomer.address },
    });
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: validCustomer.phone },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        customer: validCustomer,
        items: [
          { menuItemId: '1', quantity: 1 },
          { menuItemId: '2', quantity: 1 },
        ],
      }),
    });
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(orderResponse);
    });
  });

  it('shows API error and preserves cart on 400', async () => {
    const onSuccess = vi.fn<(order: OrderResponse) => void>();
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'customer.phone is required' }),
        { status: 400 }
      )
    );

    render(<CheckoutForm entries={cartEntries} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: validCustomer.name },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: validCustomer.address },
    });
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: validCustomer.phone },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(
      await screen.findByText('customer.phone is required')
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('renders confirmation with returned ID and subtotal on 201', async () => {
    const onSuccess = vi.fn<(order: OrderResponse) => void>();
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(orderResponse), { status: 201 })
    );

    render(<CheckoutForm entries={cartEntries} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: validCustomer.name },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: validCustomer.address },
    });
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: validCustomer.phone },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(orderResponse);
    });
    expect(onSuccess.mock.calls[0][0].id).toBe('order123');
    expect(onSuccess.mock.calls[0][0].subtotal).toBe(22.98);
  });

  it('shows Unable to place order on network failure', async () => {
    const onSuccess = vi.fn<(order: OrderResponse) => void>();
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    render(<CheckoutForm entries={cartEntries} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: validCustomer.name },
    });
    fireEvent.change(screen.getByLabelText('Address'), {
      target: { value: validCustomer.address },
    });
    fireEvent.change(screen.getByLabelText('Phone'), {
      target: { value: validCustomer.phone },
    });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(
      await screen.findByText('Unable to place order')
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
