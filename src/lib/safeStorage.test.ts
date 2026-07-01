import { describe, it, expect } from 'vitest';
import { safeParse } from './safeStorage';

describe('safeParse', () => {
  it('returns parsed value for valid JSON', () => {
    expect(safeParse('{"a":1}', {})).toEqual({ a: 1 });
    expect(safeParse('[1,2,3]', [])).toEqual([1, 2, 3]);
  });

  it('returns the fallback when raw is null', () => {
    expect(safeParse(null, { default: true })).toEqual({ default: true });
    expect(safeParse<number[]>(null, [])).toEqual([]);
  });

  it('returns the fallback for corrupt JSON without throwing', () => {
    expect(() => safeParse('{bad', { ok: false })).not.toThrow();
    expect(safeParse('{bad', { ok: false })).toEqual({ ok: false });
    expect(safeParse('undefined', 'fallback')).toBe('fallback');
  });
});
