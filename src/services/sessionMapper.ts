import { normalizeHeader } from "../lib/csv";
import type { SessionSegment, StudySession } from "../types";

/** "Study Sessions" tab. Keys in toSessionPayload normalise to these titles. */
export const SESSION_HEADERS = ["Id", "Category", "Subject Id", "Subject", "Topic Id", "Topic", "Status", "Segments", "Note", "Updated At"] as const;

function parseSegments(raw: string): SessionSegment[] {
  try {
    const v: unknown = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((s): s is { start: unknown; end: unknown } => typeof s === "object" && s !== null && "start" in s)
      .filter((s) => typeof s.start === "string" && !Number.isNaN(Date.parse(s.start)))
      .map((s) => ({
        start: s.start as string,
        end: typeof s.end === "string" && !Number.isNaN(Date.parse(s.end)) ? s.end : null,
      }));
  } catch {
    return [];
  }
}

export function sessionsFromTable(table: readonly (readonly string[])[]): StudySession[] {
  if (table.length === 0) return [];
  const headers = table[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(normalizeHeader(name));
  const idx = {
    id: col("Id"),
    category: col("Category"),
    subjectId: col("Subject Id"),
    subject: col("Subject"),
    topicId: col("Topic Id"),
    topic: col("Topic"),
    segments: col("Segments"),
    note: col("Note"),
    updatedAt: col("Updated At"),
  };
  if (idx.id === -1 || idx.segments === -1) {
    throw new Error("The “Study Sessions” tab is missing or its header row doesn't match.");
  }
  const out: StudySession[] = [];
  for (const cells of table.slice(1)) {
    const get = (i: number) => (i === -1 ? "" : (cells[i] ?? "").trim());
    const id = get(idx.id);
    const segments = parseSegments(get(idx.segments));
    if (!id || segments.length === 0) continue;
    out.push({
      id,
      category: get(idx.category).toUpperCase() === "IT" ? "IT" : "BCS",
      subjectId: get(idx.subjectId),
      subjectName: get(idx.subject),
      topicId: get(idx.topicId),
      topicName: get(idx.topic),
      segments,
      note: idx.note === -1 ? "" : (cells[idx.note] ?? "").replace(/\r\n/g, "\n").trim(),
      updatedAt: get(idx.updatedAt),
    });
  }
  // Most recently touched first; the app treats the first as the active one.
  return out.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function toSessionPayload(s: StudySession): Record<string, unknown> {
  const running = s.segments.length > 0 && s.segments[s.segments.length - 1].end === null;
  return {
    id: s.id,
    category: s.category,
    subjectId: s.subjectId,
    subject: s.subjectName,
    topicId: s.topicId,
    topic: s.topicName,
    status: running ? "RUNNING" : "PAUSED",
    segments: JSON.stringify(s.segments),
    note: s.note,
    updatedAt: s.updatedAt,
  };
}
