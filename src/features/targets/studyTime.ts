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

/** Bangladesh weekend: Friday and Saturday (getDay 5 and 6). */
export const WEEKEND_DAYS: readonly number[] = [5, 6];

export function isWeekend(iso: string): boolean {
  return WEEKEND_DAYS.includes(new Date(`${iso}T00:00:00`).getDay());
}

/** Weekday target, falling back to weekly ÷ 7 when only a weekly target is set. */
export function dailyTarget(s: StudySettings): number {
  return s.dailyTargetMinutes || s.weeklyTargetMinutes / 7;
}

/** The target for one specific day: the weekend target on Fri/Sat if set, otherwise the weekday target. */
export function targetForDate(s: StudySettings, iso: string): number {
  return isWeekend(iso) && s.weekendTargetMinutes > 0 ? s.weekendTargetMinutes : dailyTarget(s);
}

/** Weekly target; when not set explicitly, 5 weekdays + 2 weekend days of daily targets. */
export function weeklyTarget(s: StudySettings): number {
  if (s.weeklyTargetMinutes) return s.weeklyTargetMinutes;
  const weekend = s.weekendTargetMinutes || s.dailyTargetMinutes;
  return s.dailyTargetMinutes * 5 + weekend * 2;
}

export interface PeriodTarget {
  /** Target for the whole period. */
  readonly full: number;
  /** Target for the days that have passed so far (= full for past periods). */
  readonly toDate: number;
}

/**
 * Target for a period. Days use their own (weekday/weekend) target; weeks use
 * the weekly target; months/years add up each day's target. The current
 * (unfinished) period is judged "on pace" against the days elapsed so far,
 * weighted by those days' own targets.
 */
export function periodTarget(kind: PeriodKind, range: DateRange, s: StudySettings, today: string): PeriodTarget | null {
  const dates = datesInRange(range);
  const perDay = dates.map((d) => targetForDate(s, d));
  const sumAll = perDay.reduce((n, m) => n + m, 0);
  const sumElapsed = dates.reduce((n, d, i) => (d <= today ? n + perDay[i] : n), 0);
  const full = kind === "day" ? targetForDate(s, range.from) : kind === "week" ? weeklyTarget(s) : sumAll;
  if (!(full > 0)) return null;
  return { full, toDate: sumAll > 0 ? (full * sumElapsed) / sumAll : full };
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

export interface HitCount {
  readonly met: number;
  readonly missed: number;
}

/**
 * How many days / weeks in `range` hit their target. Only finished days and
 * weeks count — plus the current one if it's already met — and nothing before
 * `firstLogged` (you weren't tracking yet). Null when no target is set.
 */
export function hitRate(
  byDate: ReadonlyMap<string, number>,
  range: DateRange,
  s: StudySettings,
  today: string,
  firstLogged: string,
): { days: HitCount | null; weeks: HitCount | null } {
  const daily = dailyTarget(s);
  const weekly = weeklyTarget(s);

  let days: HitCount | null = null;
  if (daily > 0) {
    let met = 0;
    let missed = 0;
    for (const d of datesInRange(range)) {
      if (d < firstLogged || d > today) continue;
      const hit = (byDate.get(d) ?? 0) >= targetForDate(s, d);
      if (hit) met++;
      else if (d < today) missed++;
    }
    days = { met, missed };
  }

  let weeks: HitCount | null = null;
  if (weekly > 0) {
    let met = 0;
    let missed = 0;
    for (const w of weeksIn(range)) {
      if (w.to < firstLogged || w.from > today) continue;
      const hit = sumRange(byDate, w) >= weekly;
      if (hit) met++;
      else if (w.to < today) missed++;
    }
    weeks = { met, missed };
  }
  return { days, weeks };
}

export interface WeekPlan {
  readonly weekly: number;
  readonly done: number;
  /** Minutes still needed to reach the weekly target (0 when met). */
  readonly need: number;
  readonly daysPassed: number;
  /** Days still open, today included. */
  readonly weekdaysLeft: number;
  readonly weekendLeft: number;
  readonly daysLeft: number;
  /** Need ÷ days left. */
  readonly evenPerDay: number;
  /** Keep the weekend target on remaining weekend days; weekdays cover the rest. Null without a weekend target or weekdays left. */
  readonly keepWeekend: { readonly weekendPerDay: number; readonly weekdayPerDay: number } | null;
  /** How the weekly target is made up, when it comes from daily/weekend targets. */
  readonly makeup: { readonly weekday: number; readonly weekend: number } | null;
}

/**
 * What it takes to still hit this week's (Sat–Fri) target from today on.
 * Today counts as a day left (it isn't over); what you've logged today is
 * already in `done`.
 */
export function weekPlan(byDate: ReadonlyMap<string, number>, s: StudySettings, today: string): WeekPlan | null {
  const weekly = weeklyTarget(s);
  if (!(weekly > 0)) return null;
  const range = periodRange("week", today);
  const dates = datesInRange(range);
  const done = sumRange(byDate, range);
  const left = dates.filter((d) => d >= today);
  const weekendLeft = left.filter(isWeekend).length;
  const weekdaysLeft = left.length - weekendLeft;
  const need = Math.max(0, weekly - done);
  const weekendTarget = s.weekendTargetMinutes;
  let keepWeekend: WeekPlan["keepWeekend"] = null;
  if (need > 0 && weekendTarget > 0 && weekdaysLeft > 0 && weekendLeft > 0) {
    // What the remaining weekend days still have to contribute — minus anything already logged on them (e.g. today).
    const weekendStillDue = left.filter(isWeekend).reduce((n, d) => n + Math.max(0, weekendTarget - (byDate.get(d) ?? 0)), 0);
    // Weekdays left, also crediting what's already logged on them today.
    const weekdayLoggedLeft = left.filter((d) => !isWeekend(d)).reduce((n, d) => n + (byDate.get(d) ?? 0), 0);
    const weekdayNeed = Math.max(0, need - weekendStillDue);
    keepWeekend = { weekendPerDay: weekendTarget, weekdayPerDay: (weekdayNeed + weekdayLoggedLeft) / weekdaysLeft };
  }
  return {
    weekly,
    done,
    need,
    daysPassed: dates.length - left.length,
    weekdaysLeft,
    weekendLeft,
    daysLeft: left.length,
    evenPerDay: left.length ? need / left.length : need,
    keepWeekend,
    makeup: !s.weeklyTargetMinutes && s.dailyTargetMinutes ? { weekday: s.dailyTargetMinutes, weekend: s.weekendTargetMinutes || s.dailyTargetMinutes } : null,
  };
}
