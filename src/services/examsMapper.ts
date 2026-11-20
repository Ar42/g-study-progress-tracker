import { normalizeHeader } from "../lib/csv";
import { normalizeSheetDate } from "../lib/date";
import type { Exam, ExamLink, ExamPriority, ExamType } from "../types";

/** "Exams" tab. Payload keys in toExamPayload normalise to these titles. */
export const EXAM_HEADERS = [
  "Id", "Title", "Organization", "Type", "Priority", "Grade", "Salary Monthly", "Salary Gross",
  "Total Seats", "Seats Confirmed", "Circular Date", "Website", "Links", "Apply Deadline", "Applied",
  "Exam Date", "Exam Time", "Exam Date Estimated", "Centre Name", "Centre Map", "Centre Notes",
  "Credentials", "Description", "Hide On Dashboard", "Created At", "Updated At",
] as const;

const bool = (v: string) => /^(true|yes|1)$/i.test(v.trim());
const priority = (v: string): ExamPriority => (v.toUpperCase() === "HIGH" ? "HIGH" : v.toUpperCase() === "LOW" ? "LOW" : "MEDIUM");
const type = (v: string): ExamType => (v.toUpperCase() === "IT" ? "IT" : "GENERAL");

function links(raw: string): ExamLink[] {
  if (!raw.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is { title?: unknown; url?: unknown } => typeof l === "object" && l !== null)
      .map((l) => ({ title: String(l.title ?? ""), url: String(l.url ?? "") }))
      .filter((l) => l.url);
  } catch {
    // Hand-typed cell: one URL per line.
    return raw.split(/\s+/).filter((u) => /^https?:\/\//.test(u)).map((url) => ({ title: "", url }));
  }
}

export function examsFromTable(table: readonly (readonly string[])[]): Exam[] {
  if (table.length === 0) return [];
  const headers = table[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(normalizeHeader(name));
  const idx = Object.fromEntries(EXAM_HEADERS.map((h) => [h, col(h)])) as Record<(typeof EXAM_HEADERS)[number], number>;
  if (idx.Id === -1 || idx.Title === -1) throw new Error("The “Exams” tab is missing or its header row doesn't match.");

  const out: Exam[] = [];
  for (const cells of table.slice(1)) {
    const get = (h: (typeof EXAM_HEADERS)[number]) => (idx[h] === -1 ? "" : (cells[idx[h]] ?? "").trim());
    const id = get("Id");
    const title = get("Title");
    if (!id || !title) continue;
    out.push({
      id,
      title,
      organization: get("Organization"),
      type: type(get("Type")),
      priority: priority(get("Priority")),
      grade: get("Grade"),
      salaryMonthly: get("Salary Monthly"),
      salaryGross: get("Salary Gross"),
      totalSeats: get("Total Seats"),
      seatsConfirmed: bool(get("Seats Confirmed")),
      circularDate: normalizeSheetDate(get("Circular Date")),
      website: get("Website"),
      links: links(get("Links")),
      applyDeadline: normalizeSheetDate(get("Apply Deadline")),
      applied: bool(get("Applied")),
      examDate: normalizeSheetDate(get("Exam Date")),
      examTime: get("Exam Time"),
      examDateEstimated: bool(get("Exam Date Estimated")),
      centreName: get("Centre Name"),
      centreMap: get("Centre Map"),
      centreNotes: get("Centre Notes"),
      credentials: get("Credentials"),
      description: get("Description"),
      hideOnDashboard: bool(get("Hide On Dashboard")),
      createdAt: get("Created At"),
      updatedAt: get("Updated At"),
    });
  }
  return out;
}

export function toExamPayload(e: Exam): Record<string, unknown> {
  return { ...e, links: JSON.stringify(e.links) };
}
