import { describe, it, expect } from 'vitest';
import { computeElapsedCredit, MAX_CATCHUP_SECONDS } from './gameTime';

const QUARTER = 15 * 60; // 900s, matches useGameState QUARTER_DURATION

describe('computeElapsedCredit', () => {
  it('credits a normal 1s tick', () => {
    const r = computeElapsedCredit({ lastTickAt: 1000, nowSec: 1001, quarterTime: 0, quarterDuration: QUARTER });
    expect(r.deltaUsed).toBe(1);
    expect(r.gapTooLong).toBe(false);
    expect(Number.isNaN(r.deltaUsed)).toBe(false);
  });

  it('returns 0 when lastTickAt is null', () => {
    const r = computeElapsedCredit({ lastTickAt: null, nowSec: 1001, quarterTime: 0, quarterDuration: QUARTER });
    expect(r.deltaUsed).toBe(0);
    expect(r.gapTooLong).toBe(false);
  });

  it('returns 0 for a negative or zero delta (clock went backwards / same tick)', () => {
    const negative = computeElapsedCredit({ lastTickAt: 2000, nowSec: 1000, quarterTime: 0, quarterDuration: QUARTER });
    expect(negative.deltaUsed).toBe(0);
    expect(negative.gapTooLong).toBe(false);

    const zero = computeElapsedCredit({ lastTickAt: 1000, nowSec: 1000, quarterTime: 0, quarterDuration: QUARTER });
    expect(zero.deltaUsed).toBe(0);
    expect(zero.gapTooLong).toBe(false);
  });

  it('caps an 8-hour gap at MAX_CATCHUP_SECONDS and flags gapTooLong', () => {
    const eightHours = 8 * 60 * 60;
    const r = computeElapsedCredit({ lastTickAt: 0, nowSec: eightHours, quarterTime: 0, quarterDuration: QUARTER });
    expect(r.deltaUsed).toBe(MAX_CATCHUP_SECONDS);
    expect(r.gapTooLong).toBe(true);
    expect(Number.isNaN(r.deltaUsed)).toBe(false);
  });

  it('bounds credit by the quarter remaining', () => {
    // Only 5s left in the quarter; a 60s real delta can only credit 5s.
    const r = computeElapsedCredit({ lastTickAt: 1000, nowSec: 1060, quarterTime: QUARTER - 5, quarterDuration: QUARTER });
    expect(r.deltaUsed).toBe(5);
    expect(r.gapTooLong).toBe(false);
    expect(Number.isNaN(r.deltaUsed)).toBe(false);
  });

  it('never produces NaN even at the quarter boundary', () => {
    const r = computeElapsedCredit({ lastTickAt: 1000, nowSec: 1060, quarterTime: QUARTER, quarterDuration: QUARTER });
    expect(r.deltaUsed).toBe(0);
    expect(Number.isNaN(r.deltaUsed)).toBe(false);
  });
});
