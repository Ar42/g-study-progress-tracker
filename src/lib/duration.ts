/**
 * Durations are minutes (number, up to 1 decimal). Users can type them freely:
 *   "30" "90" "10.2"      → minutes
 *   "1:30"                → h:mm
 *   "2h" "1h 30m" "45m" "1.5h" "1 hr 20 min" → units
 */
export type ParsedDuration = { ok: true; minutes: number } | { ok: false; error: string };

const round1 = (n: number) => Math.round(n * 10) / 10;

const UNITS = /^(?:(\d+(?:\.\d+)?)\s*h(?:ours?|rs?)?)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in(?:ute)?s?)?)?$/;

export function parseDuration(input: string): ParsedDuration {
  const s = input.trim().toLowerCase().replace(/,/g, ".");
  if (!s) return { ok: false, error: "Enter a duration" };

  let minutes: number | null = null;
  let m: RegExpMatchArray | null;
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    minutes = Number(s);
  } else if ((m = s.match(/^(\d+):([0-5]\d)$/))) {
    minutes = Number(m[1]) * 60 + Number(m[2]);
  } else if ((m = s.match(UNITS)) && (m[1] !== undefined || m[2] !== undefined)) {
    minutes = Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
  }

  if (minutes === null || !Number.isFinite(minutes)) {
    return { ok: false, error: "Try 45, 10.5, 1:30 or 1h 30m" };
  }
  minutes = round1(minutes);
  if (minutes <= 0) return { ok: false, error: "Must be more than 0" };
  return { ok: true, minutes };
}

/** "1h 30m", "45m", "<1m" (rounded to whole minutes for display). */
export function formatMinutes(min: number): string {
  if (!(min > 0)) return "0m";
  if (min < 1) return "<1m";
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Stopwatch text: "4:07" or "1:04:07". */
export function formatClock(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
