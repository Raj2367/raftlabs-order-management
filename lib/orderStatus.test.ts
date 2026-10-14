import { describe, it, expect } from 'vitest';
import {
  ORDER_STATUSES,
  rank,
  nextStatus,
  deriveStatus,
  effectiveStatus,
} from '@/lib/orderStatus';

describe('orderStatus', () => {
  describe('rank', () => {
    it('returns 0..3 in declared order', () => {
      ORDER_STATUSES.forEach((status, idx) => {
        expect(rank(status)).toBe(idx);
      });
    });
  });

  describe('nextStatus', () => {
    it('advances exactly one step forward', () => {
      expect(nextStatus('received')).toBe('preparing');
      expect(nextStatus('preparing')).toBe('out_for_delivery');
      expect(nextStatus('out_for_delivery')).toBe('delivered');
    });

    it('returns null at delivered', () => {
      expect(nextStatus('delivered')).toBeNull();
    });
  });

  describe('deriveStatus', () => {
    const base = new Date(0);

    it('returns received at exactly 0ms', () => {
      expect(deriveStatus(base, new Date(0))).toBe('received');
    });

    it('returns preparing at exactly 15_000ms', () => {
      expect(deriveStatus(base, new Date(15_000))).toBe('preparing');
    });

    it('returns out_for_delivery at exactly 45_000ms', () => {
      expect(deriveStatus(base, new Date(45_000))).toBe('out_for_delivery');
    });

    it('returns delivered at exactly 90_000ms', () => {
      expect(deriveStatus(base, new Date(90_000))).toBe('delivered');
    });

    it('returns received at 14_999ms', () => {
      expect(deriveStatus(base, new Date(14_999))).toBe('received');
    });

    it('returns preparing at 44_999ms', () => {
      expect(deriveStatus(base, new Date(44_999))).toBe('preparing');
    });

    it('returns out_for_delivery at 89_999ms', () => {
      expect(deriveStatus(base, new Date(89_999))).toBe('out_for_delivery');
    });
  });

  describe('effectiveStatus', () => {
    it('returns the higher rank when derived is ahead', () => {
      expect(effectiveStatus('received', 'preparing')).toBe('preparing');
      expect(effectiveStatus('received', 'out_for_delivery')).toBe(
        'out_for_delivery'
      );
      expect(effectiveStatus('preparing', 'delivered')).toBe('delivered');
    });

    it('returns stored on tie', () => {
      expect(effectiveStatus('received', 'received')).toBe('received');
      expect(effectiveStatus('delivered', 'delivered')).toBe('delivered');
    });

    it('returns stored when derived is behind', () => {
      expect(effectiveStatus('preparing', 'received')).toBe('preparing');
      expect(effectiveStatus('delivered', 'preparing')).toBe('delivered');
    });
  });
});
