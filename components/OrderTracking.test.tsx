import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import OrderTracking from '@/components/OrderTracking';

const TEST_INTERVAL = 100;

const mockResponse = (status: string, statusCode = 200) =>
  new Response(JSON.stringify({ status }), {
    status: statusCode,
    headers: { 'content-type': 'application/json' },
  });

async function advanceTimers(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

describe('OrderTracking', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches once after mount + interval elapses', async () => {
    vi.mocked(global.fetch).mockResolvedValue(mockResponse('received'));

    render(
      <OrderTracking
        orderId="order-1"
        initialStatus="received"
        pollIntervalMs={TEST_INTERVAL}
      />
    );

    await advanceTimers(TEST_INTERVAL);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders/order-1',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('advances status across polls: received → preparing → out_for_delivery', async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(mockResponse('preparing'))
      .mockResolvedValueOnce(mockResponse('out_for_delivery'))
      .mockResolvedValue(mockResponse('out_for_delivery'));

    render(
      <OrderTracking
        orderId="order-1"
        initialStatus="received"
        pollIntervalMs={TEST_INTERVAL}
      />
    );

    await advanceTimers(TEST_INTERVAL);
    await vi.waitFor(() =>
      expect(screen.getByText(/Current status: Preparing/)).toBeInTheDocument()
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await advanceTimers(TEST_INTERVAL);
    await vi.waitFor(() =>
      expect(
        screen.getByText(/Current status: Out for delivery/)
      ).toBeInTheDocument()
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('stops polling after delivered', async () => {
    vi.mocked(global.fetch).mockResolvedValue(mockResponse('delivered'));

    render(
      <OrderTracking
        orderId="order-1"
        initialStatus="received"
        pollIntervalMs={TEST_INTERVAL}
      />
    );

    await advanceTimers(TEST_INTERVAL);
    await vi.waitFor(() =>
      expect(
        screen.getByText(/Current status: Delivered/)
      ).toBeInTheDocument()
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(TEST_INTERVAL * 10);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('clears pending timeout on unmount', async () => {
    vi.mocked(global.fetch).mockResolvedValue(mockResponse('received'));

    const { unmount } = render(
      <OrderTracking
        orderId="order-1"
        initialStatus="received"
        pollIntervalMs={TEST_INTERVAL}
      />
    );

    await advanceTimers(TEST_INTERVAL);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      unmount();
    });

    await act(async () => {
      vi.advanceTimersByTime(TEST_INTERVAL);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retains last status on a single failed poll, no error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('network'));

    render(
      <OrderTracking
        orderId="order-1"
        initialStatus="received"
        pollIntervalMs={TEST_INTERVAL}
      />
    );

    await advanceTimers(TEST_INTERVAL);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText(/Current status: Received/)
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders error alert after 3 consecutive failures', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('network'));

    render(
      <OrderTracking
        orderId="order-1"
        initialStatus="received"
        pollIntervalMs={TEST_INTERVAL}
      />
    );

    for (let i = 1; i <= 3; i++) {
      await advanceTimers(TEST_INTERVAL);
      expect(global.fetch).toHaveBeenCalledTimes(i);
    }

    await vi.waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });
});
