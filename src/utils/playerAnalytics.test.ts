import { describe, it, expect } from 'vitest';
import { analyzeFormTrend, categorizePlayingTime } from './playerAnalytics';
import { Player, GameRecord } from '@/types/sports';

// Minimal factories — the functions under test read only a narrow slice of each type.
const rec = (totalGameTime: number): GameRecord => ({ totalGameTime } as GameRecord);
const player = (averageGameTime: number): Player =>
  ({ seasonStats: { averageGameTime } } as Player);

describe('analyzeFormTrend', () => {
  it("returns 'stable' when the earlier baseline is all 0 (no div-by-zero)", () => {
    // 10 games: earlier window (indices 0-4) all 0, recent window (5-9) non-zero.
    const history = [
      rec(0), rec(0), rec(0), rec(0), rec(0),
      rec(600), rec(600), rec(600), rec(600), rec(600),
    ];
    const trend = analyzeFormTrend(history);
    expect(trend).toBe('stable');
  });

  it("returns 'stable' for fewer than 3 games", () => {
    expect(analyzeFormTrend([rec(600), rec(600)])).toBe('stable');
  });
});

describe('categorizePlayingTime', () => {
  it("returns 'medium' when there are no team players (no div-by-zero)", () => {
    expect(categorizePlayingTime(player(100), [])).toBe('medium');
  });

  it("returns 'medium' when the whole team has 0 average time", () => {
    const team = [player(0), player(0)];
    expect(categorizePlayingTime(player(0), team)).toBe('medium');
  });
});
