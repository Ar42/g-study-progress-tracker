import { format, parseISO, isValid, differenceInCalendarDays } from "date-fns";

/**
 * All dates in the app are plain calendar dates stored as "yyyy-mm-dd" strings.
 * They are always formatted in LOCAL time — never via toISOString(), which
 * shifts the day for timezones ahead of UTC (e.g. Asia/Dhaka, UTC+6).
 */

const ISO_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const DMY_RE = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/;

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Normalises any date-ish sheet value to "yyyy-mm-dd", or "" when unknown. */
export function normalizeSheetDate(value: string | undefined | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const iso = raw.match(ISO_RE);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;

  // Legacy rows were typed as DD-MM-YYYY.
  const dmy = raw.match(DMY_RE);
  if (dmy) return `${dmy[3]}-${pad(Number(dmy[2]))}-${pad(Number(dmy[1]))}`;

  const parsed = new Date(raw);
  return isValid(parsed) ? toISODate(parsed) : "";
}

export function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = parseISO(iso);
  return isValid(d) ? format(d, "d MMM yyyy") : iso;
}

/** Calendar days from today until `iso` (negative when in the past). */
export function daysUntil(iso: string, today: string = todayISO()): number | null {
  if (!iso) return null;
  const target = parseISO(iso);
  const now = parseISO(today);
  if (!isValid(target) || !isValid(now)) return null;
  return differenceInCalendarDays(target, now);
}
