export const MAX_CATCHUP_SECONDS = 120; // a real coach interruption is seconds; a longer gap means the app was closed/asleep — don't credit unattended time

export interface CatchUpInput {
  lastTickAt: number | null;
  nowSec: number;
  quarterTime: number;
  quarterDuration: number;
}

export interface CatchUpResult {
  deltaUsed: number;
  gapTooLong: boolean;
}

export function computeElapsedCredit({
  lastTickAt,
  nowSec,
  quarterTime,
  quarterDuration,
}: CatchUpInput): CatchUpResult {
  if (lastTickAt == null) return { deltaUsed: 0, gapTooLong: false };
  const rawDelta = nowSec - lastTickAt;
  if (rawDelta <= 0) return { deltaUsed: 0, gapTooLong: false };
  const gapTooLong = rawDelta > MAX_CATCHUP_SECONDS;
  const bounded = Math.min(rawDelta, MAX_CATCHUP_SECONDS);
  const maxDelta = Math.max(0, quarterDuration - quarterTime);
  return { deltaUsed: Math.min(bounded, maxDelta), gapTooLong };
}
