import { describe, it, expect } from 'vitest';
import { calculateConsistencyScore } from './seasonManager';
import { GameRecord } from '@/types/sports';

// Minimal GameRecord factory — calculateConsistencyScore only reads totalGameTime.
const rec = (totalGameTime: number): GameRecord =>
  ({ totalGameTime } as GameRecord);

describe('calculateConsistencyScore', () => {
  it('returns a finite 10 (not NaN) when all game times are 0', () => {
    const score = calculateConsistencyScore([rec(0), rec(0), rec(0)]);
    expect(Number.isNaN(score)).toBe(false);
    expect(score).toBe(10);
  });

  it('returns a finite value in 1..10 for a varied history', () => {
    const score = calculateConsistencyScore([rec(600), rec(700), rec(650), rec(500)]);
    expect(Number.isNaN(score)).toBe(false);
    expect(score).toBeGreaterThanOrEqual(1);
    expect(score).toBeLessThanOrEqual(10);
  });

  it('returns the neutral 5 default for fewer than 2 games', () => {
    expect(calculateConsistencyScore([rec(600)])).toBe(5);
  });
});
