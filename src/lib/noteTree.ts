import type { NoteItem } from "../types";

/** Folders first, then files; each alphabetical (natural order, so "Ch 2" < "Ch 10"). */
export function sortNotes(items: readonly NoteItem[]): NoteItem[] {
  return [...items].sort(
    (a, b) =>
      (a.type === b.type ? 0 : a.type === "FOLDER" ? -1 : 1) ||
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
}

export function childrenOf(items: readonly NoteItem[], parentId: string): NoteItem[] {
  return sortNotes(items.filter((i) => i.parentId === parentId));
}

/** All ids inside a folder (not including the folder itself), any depth. Cycle-safe. */
export function descendantIds(items: readonly NoteItem[], folderId: string): string[] {
  const out: string[] = [];
  const seen = new Set([folderId]);
  const queue = [folderId];
  while (queue.length) {
    const parent = queue.shift()!;
    for (const i of items) {
      if (i.parentId === parent && !seen.has(i.id)) {
        seen.add(i.id);
        out.push(i.id);
        queue.push(i.id);
      }
    }
  }
  return out;
}

/** Folders from the top level down to `folderId` (for breadcrumbs). Cycle-safe. */
export function pathTo(items: readonly NoteItem[], folderId: string): NoteItem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const path: NoteItem[] = [];
  const seen = new Set<string>();
  let cur = byId.get(folderId);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

/**
 * Whether `item` may move into `targetFolderId` ("" = top level): not into
 * itself, not into one of its own sub-folders, and not where it already is.
 */
export function canMoveTo(items: readonly NoteItem[], item: NoteItem, targetFolderId: string): boolean {
  if (targetFolderId === item.parentId) return false;
  if (targetFolderId === "") return true;
  if (targetFolderId === item.id) return false;
  const target = items.find((i) => i.id === targetFolderId);
  if (!target || target.type !== "FOLDER") return false;
  return item.type === "FILE" || !descendantIds(items, item.id).includes(targetFolderId);
}

/** Items whose parent no longer exists are shown at the top level so nothing is ever hidden. */
export function effectiveParent(items: readonly NoteItem[], item: NoteItem): string {
  if (!item.parentId) return "";
  const parent = items.find((i) => i.id === item.parentId);
  return parent && parent.type === "FOLDER" ? item.parentId : "";
}

/** Same items with orphaned parents re-pointed to the top level (view only; the sheet is untouched). */
export function withRepairedParents(items: readonly NoteItem[]): NoteItem[] {
  return items.map((i) => {
    const p = effectiveParent(items, i);
    return p === i.parentId ? i : { ...i, parentId: p };
  });
}
