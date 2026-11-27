import { normalizeHeader } from "../lib/csv";
import { normalizeSheetDate } from "../lib/date";
import { parseStoredStatus } from "../lib/status";
import type { LinkItem, ProgressUnit, StudyDomain, StudyRow } from "../types";

/** Sheet header (normalised) → field. Matches what Code.gs reads/writes. */
const COLUMN_ALIASES = {
  id: ["id"],
  name: ["name"],
  parentId: ["parentid"],
  status: ["status"],
  preliMarks: ["prelimarks"],
  comments: ["comments", "comment"],
  startedDate: ["starteddate"],
  targetDate: ["targettocompletedate", "targetdate"],
  completedDate: ["completeddate"],
  links: ["links", "link"],
  isSubject: ["issubject"],
  units: ["units", "progressunits"],
} as const;

type Column = keyof typeof COLUMN_ALIASES;

function parseLinks(raw: string): { links: LinkItem[]; linksRaw: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { links: [], linksRaw: null };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return { links: [], linksRaw: trimmed };
    const links = parsed
      .filter((l): l is Record<string, unknown> => typeof l === "object" && l !== null)
      .map((l) => ({
        title: String(l.title ?? ""),
        link: String(l.link ?? ""),
        sourceName: String(l.sourceName ?? ""),
      }));
    return { links, linksRaw: null };
  } catch {
    // Keep unparseable content verbatim so a save never destroys it.
    return { links: [], linksRaw: trimmed };
  }
}

const toCount = (v: unknown) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function parseUnits(raw: string): { units: ProgressUnit[]; unitsRaw: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { units: [], unitsRaw: null };
  try {
    const parsed: unknown = JSON.parse(trimmed);
    // Accept a single object as well as an array of them.
    const list = Array.isArray(parsed) ? parsed : [parsed];
    if (!list.every((u) => typeof u === "object" && u !== null)) return { units: [], unitsRaw: trimmed };
    const units = (list as Record<string, unknown>[]).map((u) => ({
      unit: String(u.unit ?? "").trim(),
      total: toCount(u.total),
      finished: toCount(u.finished),
    }));
    return { units, unitsRaw: null };
  } catch {
    // Keep unparseable content verbatim so a save never destroys it.
    return { units: [], unitsRaw: trimmed };
  }
}

/** Converts a header row + data rows (strings) into normalised StudyRows. */
export function rowsFromTable(table: readonly (readonly string[])[]): StudyRow[] {
  if (table.length === 0) return [];
  const headers = table[0].map(normalizeHeader);
  const index = {} as Record<Column, number>;
  for (const col of Object.keys(COLUMN_ALIASES) as Column[]) {
    index[col] = headers.findIndex((h) => (COLUMN_ALIASES[col] as readonly string[]).includes(h));
  }
  if (index.id === -1 || index.name === -1) {
    throw new Error("Sheet is missing the 'Id' or 'Name' column.");
  }

  const rows: StudyRow[] = [];
  for (const cells of table.slice(1)) {
    const get = (col: Column) => (index[col] === -1 ? "" : (cells[index[col]] ?? "").trim());
    const id = get("id");
    const name = get("name");
    if (!id || !name) continue;

    const rawStatus = get("status");
    rows.push({
      id,
      name,
      parentId: get("parentId"),
      status: parseStoredStatus(rawStatus),
      rawStatus,
      preliMarks: get("preliMarks"),
      comments: get("comments"),
      startedDate: normalizeSheetDate(get("startedDate")),
      targetDate: normalizeSheetDate(get("targetDate")),
      completedDate: normalizeSheetDate(get("completedDate")),
      ...parseLinks(get("links")),
      isSubject: get("isSubject").toUpperCase() === "TRUE",
      ...parseUnits(get("units")),
    });
  }
  return rows;
}

/**
 * Builds the write payload for Code.gs. Always sends EVERY field, because the
 * currently deployed script blanks any field that is missing from the payload.
 */
export function toPayload(row: StudyRow, domain: StudyDomain): Record<string, unknown> {
  const common = {
    id: row.id,
    name: row.name.trim(),
    comments: row.comments,
    startedDate: row.startedDate,
    targetToCompleteDate: row.targetDate,
    completedDate: row.completedDate,
    links: row.linksRaw ?? row.links,
    units: row.unitsRaw ?? row.units,
  };

  if (domain === "IT") {
    return { ...common, status: row.status };
  }

  return {
    ...common,
    parentId: row.parentId,
    // Subjects carry no meaningful status; write back whatever was there.
    status: row.isSubject ? row.rawStatus : row.status,
    preliMarks: row.preliMarks,
    is_subject: row.isSubject,
  };
}

export function emptyRow(id: string, overrides: Partial<StudyRow> = {}): StudyRow {
  return {
    id,
    name: "",
    parentId: "",
    status: "NOT_STARTED",
    rawStatus: "NOT_STARTED",
    preliMarks: "",
    comments: "",
    startedDate: "",
    targetDate: "",
    completedDate: "",
    links: [],
    linksRaw: null,
    isSubject: false,
    units: [],
    unitsRaw: null,
    ...overrides,
  };
}
