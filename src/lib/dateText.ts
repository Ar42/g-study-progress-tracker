import { addDays, isValid, parse, parseISO } from "date-fns";
import { toISODate } from "./date";

/**
 * Parses a typed date into ISO (yyyy-mm-dd), or null if it isn't one.
 * Day comes before month (as used in Bangladesh). Accepts:
 *   2026-11-21 · 21/11/2026 · 21-11-2026 · 21.11.2026 · 21/11/26
 *   21/11 or 21-11 (this year) · 21 Nov · 21 Nov 2026 · Nov 21 2026
 *   today · yesterday · tomorrow
 */
export function parseDateText(input: string, today: string): string | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, " ").replace(/,/g, "");
  if (!s) return null;
  const base = parseISO(today);

  if (s === "today") return today;
  if (s === "yesterday") return toISODate(addDays(base, -1));
  if (s === "tomorrow") return toISODate(addDays(base, 1));

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return valid(+m[1], +m[2], +m[3]);

  m = s.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/);
  if (m) {
    const year = m[3] === undefined ? base.getFullYear() : m[3].length === 2 ? 2000 + +m[3] : +m[3];
    return valid(year, +m[2], +m[1]);
  }

  // "21 nov", "21 nov 2026", "nov 21", "nov 21 2026", full month names too.
  const year = String(base.getFullYear());
  for (const fmt of ["d MMM yyyy", "d MMMM yyyy", "MMM d yyyy", "MMMM d yyyy", "d MMM", "d MMMM", "MMM d", "MMMM d"]) {
    const text = /yyyy/.test(fmt) ? s : `${s} ${year}`;
    const d = parse(text, /yyyy/.test(fmt) ? fmt : `${fmt} yyyy`, base);
    if (isValid(d)) return toISODate(d);
  }
  return null;
}

function valid(y: number, mo: number, d: number): string | null {
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? toISODate(date) : null;
}
