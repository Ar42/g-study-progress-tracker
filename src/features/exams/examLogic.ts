import { addDays, endOfWeek, parseISO } from "date-fns";
import type { Tone } from "../../components/ui";
import { daysUntil, toISODate, todayISO } from "../../lib/date";
import type { Exam, ExamPriority } from "../../types";

export const PRIORITY_META: Record<ExamPriority, { label: string; tone: Tone; rank: number }> = {
  HIGH: { label: "High", tone: "danger", rank: 0 },
  MEDIUM: { label: "Medium", tone: "warning", rank: 1 },
  LOW: { label: "Low", tone: "neutral", rank: 2 },
};

/** Where an exam stands today. Drives colour, wording and sort order. */
export type ExamPhase = "APPLY_OPEN" | "APPLIED" | "APPLY_MISSED" | "UPCOMING" | "DONE";

export interface ExamState {
  readonly phase: ExamPhase;
  /** Days to the application deadline (when it matters), else null. */
  readonly applyIn: number | null;
  /** Days to the exam, null when no date. */
  readonly examIn: number | null;
  /** The date this exam is "about" right now — used for sorting. */
  readonly nextDate: string;
}

export function examState(e: Exam, today = todayISO()): ExamState {
  const examIn = e.examDate ? daysUntil(e.examDate, today) : null;
  const applyIn = e.applyDeadline ? daysUntil(e.applyDeadline, today) : null;
  if (examIn !== null && examIn < 0) return { phase: "DONE", applyIn: null, examIn, nextDate: e.examDate };
  if (!e.applied && applyIn !== null && applyIn >= 0) return { phase: "APPLY_OPEN", applyIn, examIn, nextDate: e.applyDeadline };
  if (!e.applied && applyIn !== null && applyIn < 0) return { phase: "APPLY_MISSED", applyIn, examIn, nextDate: e.examDate || e.applyDeadline };
  return { phase: e.applied ? "APPLIED" : "UPCOMING", applyIn: null, examIn, nextDate: e.examDate };
}

/** Colour for "N days left": red within 3 days, amber within a week. */
export function urgencyTone(days: number | null): Tone {
  if (days === null) return "neutral";
  if (days <= 3) return "danger";
  if (days <= 7) return "warning";
  return "info";
}

export function daysLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

const PHASE_RANK: Record<ExamPhase, number> = { APPLY_OPEN: 0, APPLIED: 1, UPCOMING: 1, APPLY_MISSED: 2, DONE: 3 };

/** Most important first: active before finished, then priority, then soonest date. */
export function sortExams(exams: readonly Exam[], today = todayISO()): Exam[] {
  const key = (e: Exam) => {
    const st = examState(e, today);
    return { phase: PHASE_RANK[st.phase], pr: PRIORITY_META[e.priority].rank, date: st.nextDate || "9999-12-31" };
  };
  return [...exams].sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka.phase !== kb.phase) return ka.phase - kb.phase;
    if (ka.pr !== kb.pr) return ka.pr - kb.pr;
    // Finished exams: most recent first.
    return ka.phase === PHASE_RANK.DONE ? kb.date.localeCompare(ka.date) : ka.date.localeCompare(kb.date);
  });
}

/* ------------------------------------------------------------------ filters */

export type ExamWindow = "ALL" | "WEEK" | "15D" | "1M" | "2M" | "CUSTOM";
export type ExamDateField = "EXAM" | "DEADLINE";

export const WINDOW_OPTIONS: readonly { value: ExamWindow; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WEEK", label: "This week" },
  { value: "15D", label: "15 days" },
  { value: "1M", label: "1 month" },
  { value: "2M", label: "2 months" },
  { value: "CUSTOM", label: "Custom" },
];

/** Inclusive [from, to] ISO range for a window, or null for "all". Weeks run Sat–Fri. */
export function windowRange(w: ExamWindow, custom: { from: string; to: string }, today = todayISO()): [string, string] | null {
  const t = parseISO(today);
  switch (w) {
    case "ALL":
      return null;
    case "WEEK":
      return [today, toISODate(endOfWeek(t, { weekStartsOn: 6 }))];
    case "15D":
      return [today, toISODate(addDays(t, 15))];
    case "1M":
      return [today, toISODate(addDays(t, 30))];
    case "2M":
      return [today, toISODate(addDays(t, 60))];
    case "CUSTOM":
      return [custom.from || "0000-01-01", custom.to || "9999-12-31"];
  }
}

export function inRange(iso: string, range: [string, string] | null): boolean {
  if (!range) return true;
  return Boolean(iso) && iso >= range[0] && iso <= range[1];
}

export function formatMoney(raw: string): string {
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return raw && Number.isFinite(n) && n > 0 ? `৳${n.toLocaleString("en-IN")}` : raw;
}

export function mapHref(e: Pick<Exam, "centreMap" | "centreName">): string {
  if (e.centreMap) return e.centreMap;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.centreName)}`;
}
