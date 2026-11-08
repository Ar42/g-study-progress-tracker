import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { toISODate } from "./date";

/** Study weeks always run Saturday → Friday. */
export const WEEK_STARTS_ON = 6 as const;

export type PeriodKind = "day" | "week" | "month" | "year";

export interface DateRange {
  readonly from: string;
  readonly to: string;
}

export function weekStart(iso: string): string {
  return toISODate(startOfWeek(parseISO(iso), { weekStartsOn: WEEK_STARTS_ON }));
}

export function periodRange(kind: PeriodKind, anchor: string): DateRange {
  const d = parseISO(anchor);
  switch (kind) {
    case "day":
      return { from: anchor, to: anchor };
    case "week": {
      const from = weekStart(anchor);
      return { from, to: toISODate(addDays(parseISO(from), 6)) };
    }
    case "month":
      return { from: toISODate(startOfMonth(d)), to: toISODate(endOfMonth(d)) };
    case "year":
      return { from: toISODate(startOfYear(d)), to: toISODate(endOfYear(d)) };
  }
}

export function shiftPeriod(kind: PeriodKind, anchor: string, delta: number): string {
  const d = parseISO(anchor);
  const next =
    kind === "day" ? addDays(d, delta) : kind === "week" ? addWeeks(d, delta) : kind === "month" ? addMonths(d, delta) : addYears(d, delta);
  return toISODate(next);
}

export function periodLabel(kind: PeriodKind, anchor: string): string {
  const { from, to } = periodRange(kind, anchor);
  const f = parseISO(from);
  const t = parseISO(to);
  switch (kind) {
    case "day":
      return format(f, "EEEE, d MMM yyyy");
    case "week":
      return f.getFullYear() === t.getFullYear()
        ? `${format(f, "d MMM")} – ${format(t, "d MMM yyyy")}`
        : `${format(f, "d MMM yyyy")} – ${format(t, "d MMM yyyy")}`;
    case "month":
      return format(f, "MMMM yyyy");
    case "year":
      return format(f, "yyyy");
  }
}

/** Every ISO date in [from, to]. */
export function datesInRange({ from, to }: DateRange): string[] {
  const out: string[] = [];
  for (let d = parseISO(from); toISODate(d) <= to; d = addDays(d, 1)) out.push(toISODate(d));
  return out;
}

/** Days of the range that have already happened (for fair averages of the current period). */
export function elapsedDays({ from, to }: DateRange, today: string): number {
  if (today < from) return 0;
  const end = today < to ? today : to;
  return differenceInCalendarDays(parseISO(end), parseISO(from)) + 1;
}

export type RatingKey = "met" | "good" | "poor" | "bad";

export interface Rating {
  readonly key: RatingKey;
  readonly label: string;
  readonly tone: "success" | "primary" | "warning" | "danger";
}

/** ≥100 target met · 80–99 good · 50–79 poor · <50 bad. Null when no target is set. */
export function rate(actualMinutes: number, targetMinutes: number): (Rating & { pct: number }) | null {
  if (!(targetMinutes > 0)) return null;
  const pct = Math.round((actualMinutes / targetMinutes) * 100);
  if (pct >= 100) return { key: "met", label: "Target met", tone: "success", pct };
  if (pct >= 80) return { key: "good", label: "Good", tone: "primary", pct };
  if (pct >= 50) return { key: "poor", label: "Poor", tone: "warning", pct };
  return { key: "bad", label: "Bad", tone: "danger", pct };
}
