import { toISODate } from "./date";

/**
 * A timer session is a list of segments (start → end). `end: null` means the
 * segment is still running. Pausing closes the last segment; resuming adds one.
 * Times are ISO timestamps, so they survive reloads, gaps and other devices.
 */
export interface Segment {
  readonly start: string;
  readonly end: string | null;
}

const ms = (iso: string) => new Date(iso).getTime();

export function isRunning(segments: readonly Segment[]): boolean {
  return segments.length > 0 && segments[segments.length - 1].end === null;
}

/** Total studied time (pauses excluded). */
export function elapsedMs(segments: readonly Segment[], now: number = Date.now()): number {
  return segments.reduce((sum, s) => sum + Math.max(0, (s.end ? ms(s.end) : now) - ms(s.start)), 0);
}

/** Closes a running last segment at `now`. */
export function closeSegments(segments: readonly Segment[], now: number = Date.now()): Segment[] {
  return segments.map((s) => (s.end === null ? { ...s, end: new Date(Math.max(now, ms(s.start))).toISOString() } : s));
}

/** Local midnight that starts the day after `d`. */
const nextLocalMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

export interface DayShare {
  readonly date: string;
  readonly minutes: number;
}

/**
 * Splits studied time by LOCAL calendar day, so 23:45 → 00:40 becomes
 * [{day1: 15}, {day2: 40}]. Works across any number of days; pauses don't count.
 */
export function splitByLocalDay(segments: readonly Segment[], now: number = Date.now()): DayShare[] {
  const byDay = new Map<string, number>();
  for (const seg of segments) {
    let cursor = new Date(seg.start);
    const end = new Date(seg.end ? ms(seg.end) : now);
    while (cursor < end) {
      const boundary = nextLocalMidnight(cursor);
      const chunkEnd = boundary < end ? boundary : end;
      const key = toISODate(cursor);
      byDay.set(key, (byDay.get(key) ?? 0) + (chunkEnd.getTime() - cursor.getTime()));
      cursor = chunkEnd;
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, total]) => ({ date, minutes: Math.round((total / 60000) * 10) / 10 }))
    .filter((d) => d.minutes > 0);
}

/**
 * Keeps only the first `minutes` of studied time (used when you forgot to
 * pause and correct the total). Later time — the part you weren't studying —
 * is dropped, so the per-day split follows the corrected total.
 */
export function truncateToMinutes(segments: readonly Segment[], minutes: number, now: number = Date.now()): Segment[] {
  let budget = Math.max(0, minutes) * 60000;
  const out: Segment[] = [];
  for (const seg of closeSegments(segments, now)) {
    if (budget <= 0) break;
    const len = ms(seg.end!) - ms(seg.start);
    if (len <= budget) {
      out.push(seg);
      budget -= len;
    } else {
      out.push({ start: seg.start, end: new Date(ms(seg.start) + budget).toISOString() });
      budget = 0;
    }
  }
  return out;
}
