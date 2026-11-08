import { addDays, format, isValid, parseISO } from "date-fns";
import { markdownToText } from "../../lib/markdown";
import { toISODate } from "../../lib/date";
import type { LogEntry, StudyDomain } from "../../types";

export type Period = "7d" | "30d" | "all" | "custom";

export interface LogFilter {
  readonly period: Period;
  readonly from: string; // ISO, used when period === "custom"
  readonly to: string;
  readonly category: StudyDomain | "ALL";
  readonly subjectId: string; // "" = any (BCS only)
  readonly query: string;
}

export const DEFAULT_FILTER: LogFilter = { period: "30d", from: "", to: "", category: "ALL", subjectId: "", query: "" };

export function isDefaultFilter(f: LogFilter): boolean {
  return (
    f.period === DEFAULT_FILTER.period &&
    f.category === "ALL" &&
    !f.subjectId &&
    !f.query.trim() &&
    !f.from &&
    !f.to
  );
}

/** Inclusive ISO date range for a filter (empty string = unbounded). */
export function periodRange(f: LogFilter, today: string): { from: string; to: string } {
  const t = parseISO(today);
  switch (f.period) {
    case "7d":
      return { from: toISODate(addDays(t, -6)), to: today };
    case "30d":
      return { from: toISODate(addDays(t, -29)), to: today };
    case "custom":
      return { from: f.from, to: f.to };
    default:
      return { from: "", to: "" };
  }
}

export interface EntryNames {
  readonly subject: string;
  readonly topic: string;
}

/**
 * Lower-cased "subject topic note" text per entry, built once when entries or
 * names change — so typing in search doesn't re-strip Markdown on every key.
 */
export function buildSearchIndex(entries: readonly LogEntry[], names: (e: LogEntry) => EntryNames): Map<string, string> {
  const index = new Map<string, string>();
  for (const e of entries) {
    const n = names(e);
    index.set(e.id, `${n.subject} ${n.topic} ${markdownToText(e.description)}`.toLocaleLowerCase());
  }
  return index;
}

/** Applies every filter. `searchIndex` comes from buildSearchIndex. */
export function filterEntries(
  entries: readonly LogEntry[],
  f: LogFilter,
  today: string,
  searchIndex: ReadonlyMap<string, string>,
): LogEntry[] {
  const { from, to } = periodRange(f, today);
  const q = f.query.trim().toLocaleLowerCase();
  return entries.filter((e) => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (f.category !== "ALL" && e.category !== f.category) return false;
    if (f.subjectId && e.subjectId !== f.subjectId) return false;
    if (q && !(searchIndex.get(e.id) ?? "").includes(q)) return false;
    return true;
  });
}

export interface DayGroup {
  readonly date: string;
  readonly entries: LogEntry[];
  readonly minutes: number;
}

/** Newest day first; newest entry first within a day. */
export function groupByDay(entries: readonly LogEntry[]): DayGroup[] {
  const map = new Map<string, LogEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date);
    if (list) list.push(e);
    else map.set(e.date, [e]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, list]) => ({
      date,
      entries: list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
      minutes: list.reduce((n, e) => n + (e.minutes ?? 0), 0),
    }));
}

/** Consecutive days with at least one entry, ending today (or yesterday if today isn't logged yet). */
export function currentStreak(entries: readonly LogEntry[], today: string): number {
  const days = new Set(entries.map((e) => e.date));
  let cursor = parseISO(today);
  if (!days.has(today)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface Totals {
  readonly entries: number;
  readonly minutes: number;
  readonly days: number;
}

export function totals(entries: readonly LogEntry[], from = "", to = ""): Totals {
  const inRange = entries.filter((e) => (!from || e.date >= from) && (!to || e.date <= to));
  return {
    entries: inRange.length,
    minutes: inRange.reduce((n, e) => n + (e.minutes ?? 0), 0),
    days: new Set(inRange.map((e) => e.date)).size,
  };
}

// Weeks are Saturday → Friday everywhere (see lib/studyCalendar).
export { weekStart } from "../../lib/studyCalendar";
export { formatMinutes } from "../../lib/duration";

export function dayLabel(date: string, today: string): string {
  const d = parseISO(date);
  if (!isValid(d)) return date;
  if (date === today) return `Today · ${format(d, "EEE, d MMM")}`;
  if (date === toISODate(addDays(parseISO(today), -1))) return `Yesterday · ${format(d, "EEE, d MMM")}`;
  return format(d, parseISO(today).getFullYear() === d.getFullYear() ? "EEEE, d MMM" : "EEEE, d MMM yyyy");
}
