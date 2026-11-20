import { DEFAULT_FILTER, type LogFilter, type Period } from "./logStats";

/**
 * Study Log filters live in the URL (?period=custom&from=…&to=…&cat=BCS&subject=…&q=…)
 * so they survive reloads, Back, and bookmarks; the last one used is also kept
 * in localStorage and restored when /log is opened without filter params.
 */
const KEYS = ["period", "from", "to", "cat", "subject", "q"] as const;
const PERIODS: readonly Period[] = ["7d", "30d", "all", "custom"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const STORAGE_KEY = "gst.logFilter";

/** Filter from URL params, or null when the URL carries no filter at all. */
export function filterFromParams(p: URLSearchParams): LogFilter | null {
  if (!KEYS.some((k) => p.has(k))) return null;
  const period = p.get("period") as Period | null;
  const cat = p.get("cat");
  const from = p.get("from") ?? "";
  const to = p.get("to") ?? "";
  const category = cat === "BCS" || cat === "IT" ? cat : "ALL";
  return {
    period: period && PERIODS.includes(period) ? period : DEFAULT_FILTER.period,
    from: ISO.test(from) ? from : "",
    to: ISO.test(to) ? to : "",
    category,
    subjectId: category === "BCS" ? (p.get("subject") ?? "") : "",
    query: p.get("q") ?? "",
  };
}

/** Only non-default values go in the URL, so a default filter means a clean /log. */
export function filterToParams(f: LogFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.period !== DEFAULT_FILTER.period) p.set("period", f.period);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.category !== "ALL") p.set("cat", f.category);
  if (f.subjectId) p.set("subject", f.subjectId);
  if (f.query) p.set("q", f.query);
  return p;
}

export function loadSavedFilter(): LogFilter | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? filterFromParams(new URLSearchParams(raw)) : null;
  } catch {
    return null;
  }
}

export function saveFilter(f: LogFilter): void {
  try {
    localStorage.setItem(STORAGE_KEY, filterToParams(f).toString());
  } catch {
    /* storage unavailable — the URL still keeps it */
  }
}
