import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/menu/route';
import { menuItems } from '@/lib/menu';

describe('GET /api/menu', () => {
  it('returns the menuItems array from lib/menu', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(menuItems);
  });

  it('returns an array', async () => {
    const response = await GET();
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
