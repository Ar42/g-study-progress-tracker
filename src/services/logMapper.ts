import { normalizeHeader } from "../lib/csv";
import { normalizeSheetDate } from "../lib/date";
import type { LogEntry } from "../types";

/**
 * "Study Log" tab columns, in order. Code.gs writes any payload field whose
 * name matches a header (ignoring case, spaces and underscores), so these
 * titles and the payload keys in toLogPayload must stay in sync.
 */
export const LOG_HEADERS = [
  "Id",
  "Date",
  "Category",
  "Subject Id",
  "Subject",
  "Topic Id",
  "Topic",
  "Minutes",
  "Description",
  "Created At",
  "Session Id",
] as const;

export function logEntriesFromTable(table: readonly (readonly string[])[]): LogEntry[] {
  if (table.length === 0) return [];
  const headers = table[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(normalizeHeader(name));
  const idx = {
    id: col("Id"),
    date: col("Date"),
    category: col("Category"),
    subjectId: col("Subject Id"),
    subject: col("Subject"),
    topicId: col("Topic Id"),
    topic: col("Topic"),
    minutes: col("Minutes"),
    description: col("Description"),
    createdAt: col("Created At"),
    sessionId: col("Session Id"),
  };
  // Guard against reading the wrong tab (e.g. a CSV export falling back to Sheet1).
  if (idx.id === -1 || idx.date === -1 || idx.description === -1 || idx.category === -1) {
    throw new Error("The “Study Log” tab is missing or its header row doesn't match.");
  }

  const entries: LogEntry[] = [];
  for (const cells of table.slice(1)) {
    const get = (i: number) => (i === -1 ? "" : (cells[i] ?? "").trim());
    const id = get(idx.id);
    const date = normalizeSheetDate(get(idx.date));
    if (!id || !date) continue;
    const minutes = Number(get(idx.minutes));
    entries.push({
      id,
      date,
      category: get(idx.category).toUpperCase() === "IT" ? "IT" : "BCS",
      subjectId: get(idx.subjectId),
      subjectName: get(idx.subject),
      topicId: get(idx.topicId),
      topicName: get(idx.topic),
      // Up to one decimal (manual entries like "10.2", timer sessions).
      minutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 10) / 10 : null,
      // Keep the description's own line breaks (only trim the ends).
      description: idx.description === -1 ? "" : (cells[idx.description] ?? "").replace(/\r\n/g, "\n").trim(),
      createdAt: get(idx.createdAt),
      sessionId: get(idx.sessionId),
    });
  }
  return entries;
}

/** Payload for Code.gs: keys normalise to the LOG_HEADERS titles. */
export function toLogPayload(e: LogEntry): Record<string, unknown> {
  return {
    id: e.id,
    date: e.date,
    category: e.category,
    subjectId: e.subjectId,
    subject: e.subjectName,
    topicId: e.topicId,
    topic: e.topicName,
    minutes: e.minutes ?? "",
    description: e.description,
    createdAt: e.createdAt,
    sessionId: e.sessionId,
  };
}
