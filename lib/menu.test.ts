import { describe, expect, it } from 'vitest';
import { menuItems } from '@/lib/menu';

describe('menu', () => {
  it('exposes menuItems as an array', () => {
    expect(Array.isArray(menuItems)).toBe(true);
  });
});
