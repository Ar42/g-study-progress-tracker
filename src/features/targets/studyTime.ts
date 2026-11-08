import { datesInRange, elapsedDays, periodRange, weekStart, type DateRange, type PeriodKind } from "../../lib/studyCalendar";
import type { LogEntry, StudySettings } from "../../types";

/** Minutes studied per ISO date. */
export function minutesByDate(entries: readonly LogEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e.minutes) map.set(e.date, (map.get(e.date) ?? 0) + e.minutes);
  }
  return map;
}

export function sumRange(byDate: ReadonlyMap<string, number>, { from, to }: DateRange): number {
  let total = 0;
  for (const [date, m] of byDate) if (date >= from && date <= to) total += m;
  return total;
}

/** Daily target, falling back to weekly ÷ 7 when only a weekly target is set. */
export function dailyTarget(s: StudySettings): number {
  return s.dailyTargetMinutes || s.weeklyTargetMinutes / 7;
}

/** Weekly target, falling back to daily × 7 when only a daily target is set. */
export function weeklyTarget(s: StudySettings): number {
  return s.weeklyTargetMinutes || s.dailyTargetMinutes * 7;
}

export interface PeriodTarget {
  /** Target for the whole period. */
  readonly full: number;
  /** Target for the days that have passed so far (= full for past periods). */
  readonly toDate: number;
}

/**
 * Target for a period. Weeks use the weekly target; months/years use the daily
 * target per day. The current (unfinished) period is judged "on pace" against
 * the days elapsed so far, not the whole period.
 */
export function periodTarget(kind: PeriodKind, range: DateRange, s: StudySettings, today: string): PeriodTarget | null {
  const days = datesInRange(range).length;
  const elapsed = elapsedDays(range, today);
  const full = kind === "day" ? dailyTarget(s) : kind === "week" ? weeklyTarget(s) : dailyTarget(s) * days;
  if (!(full > 0)) return null;
  return { full, toDate: (full * elapsed) / days };
}

export interface PeriodSummary {
  readonly range: DateRange;
  readonly total: number;
  readonly studiedDays: number;
  readonly elapsedDays: number;
  readonly avgPerDay: number;
  readonly best: { date: string; minutes: number } | null;
}

export function summarize(byDate: ReadonlyMap<string, number>, kind: PeriodKind, anchor: string, today: string): PeriodSummary {
  const range = periodRange(kind, anchor);
  let total = 0;
  let studiedDays = 0;
  let best: { date: string; minutes: number } | null = null;
  for (const [date, m] of byDate) {
    if (date < range.from || date > range.to || m <= 0) continue;
    total += m;
    studiedDays++;
    if (!best || m > best.minutes) best = { date, minutes: m };
  }
  const elapsed = elapsedDays(range, today);
  return { range, total, studiedDays, elapsedDays: elapsed, avgPerDay: elapsed ? total / elapsed : 0, best };
}

/** Sat–Fri weeks overlapping [from, to], newest first. */
export function weeksIn({ from, to }: DateRange): DateRange[] {
  const out: DateRange[] = [];
  for (let start = weekStart(from); start <= to; ) {
    const r = periodRange("week", start);
    out.push(r);
    const next = new Date(`${r.to}T00:00:00`);
    next.setDate(next.getDate() + 1);
    start = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  }
  return out.reverse();
}
