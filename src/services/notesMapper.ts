import { normalizeHeader } from "../lib/csv";
import type { NoteItem } from "../types";

/** "Notes" tab. Keys in toNotePayload normalise to these titles. */
export const NOTE_HEADERS = ["Id", "Parent Id", "Type", "Name", "Link", "Created At", "Updated At"] as const;

export function notesFromTable(table: readonly (readonly string[])[]): NoteItem[] {
  if (table.length === 0) return [];
  const headers = table[0].map(normalizeHeader);
  const col = (name: string) => headers.indexOf(normalizeHeader(name));
  const idx = {
    id: col("Id"),
    parentId: col("Parent Id"),
    type: col("Type"),
    name: col("Name"),
    link: col("Link"),
    createdAt: col("Created At"),
    updatedAt: col("Updated At"),
  };
  if (idx.id === -1 || idx.name === -1 || idx.type === -1) {
    throw new Error("The “Notes” tab is missing or its header row doesn't match.");
  }
  const out: NoteItem[] = [];
  for (const cells of table.slice(1)) {
    const get = (i: number) => (i === -1 ? "" : (cells[i] ?? "").trim());
    const id = get(idx.id);
    const name = get(idx.name);
    if (!id || !name) continue;
    out.push({
      id,
      parentId: get(idx.parentId),
      type: get(idx.type).toUpperCase() === "FOLDER" ? "FOLDER" : "FILE",
      name,
      link: get(idx.link),
      createdAt: get(idx.createdAt),
      updatedAt: get(idx.updatedAt),
    });
  }
  return out;
}

export function toNotePayload(n: NoteItem): Record<string, unknown> {
  return {
    id: n.id,
    parentId: n.parentId,
    type: n.type,
    name: n.name,
    link: n.type === "FILE" ? n.link : "",
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}
