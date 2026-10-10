import type { MeetClock } from "@/app/meet";

/** Deterministic time, randomness and timers for game-loop tests. */
export function fakeClock(start: number, seed = 0.31) {
  let now = start;
  let state = Math.floor(seed * 2 ** 32) >>> 0;
  const timers: { at: number; fn: () => void; cancelled: boolean }[] = [];
  const clock: MeetClock = {
    now: () => now,
    // mulberry32: spread over [0, 1), so odds in game loops behave like real ones.
    random: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    schedule(fn, ms) {
      const timer = { at: now + ms, fn, cancelled: false };
      timers.push(timer);
      return () => {
        timer.cancelled = true;
      };
    },
  };
  /** Moves time on, firing due timers in order (including ones they schedule). */
  const advance = (ms: number): void => {
    const end = now + ms;
    for (;;) {
      const next = timers
        .filter((t) => !t.cancelled && t.at <= end)
        .toSorted((a, b) => a.at - b.at)[0];
      if (!next) break;
      now = Math.max(now, next.at);
      next.cancelled = true;
      next.fn();
    }
    now = end;
  };
  return { clock, advance };
}
