import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { NOTES_SCRIPT_VERSION } from "../../../config/constants";
import { generateRowId } from "../../../lib/id";
import { descendantIds, withRepairedParents } from "../../../lib/noteTree";
import { useDeleteNotesMutation, useGetNotesQuery, useSaveNoteMutation } from "../../../services/studyApi";
import { useSyncStatus } from "../../../services/syncStatus";
import type { NoteItem } from "../../../types";

const EMPTY: NoteItem[] = [];
const message = (e: unknown) =>
  (typeof e === "object" && e && "message" in e && typeof e.message === "string" && e.message) || "Couldn't save to Google Sheet.";

/** Notes data (orphans shown at top level) plus create / edit / move / delete. */
export function useNotes() {
  const { data, isLoading, error } = useGetNotesQuery();
  const scriptVersion = useSyncStatus((s) => s.scriptVersion);
  const [saveNote] = useSaveNoteMutation();
  const [deleteNotes] = useDeleteNotesMutation();

  const items = useMemo(() => withRepairedParents(data?.items ?? EMPTY), [data]);
  const writable = (scriptVersion ?? 0) >= NOTES_SCRIPT_VERSION;

  const save = useCallback(
    async (item: NoteItem, isNew: boolean, ok?: string) => {
      try {
        await saveNote({ item, isNew }).unwrap();
        if (ok) toast.success(ok);
        return true;
      } catch (e) {
        toast.error(isNew ? `Couldn't add “${item.name}”` : `Couldn't save “${item.name}”`, { description: message(e) });
        return false;
      }
    },
    [saveNote],
  );

  const create = useCallback(
    (fields: Pick<NoteItem, "type" | "name" | "link" | "parentId">) => {
      const now = new Date().toISOString();
      const item: NoteItem = { id: generateRowId(fields.type === "FOLDER" ? "nf" : "nl"), createdAt: now, updatedAt: now, ...fields };
      return save(item, true, fields.type === "FOLDER" ? `Folder “${item.name}” created` : `Added “${item.name}”`);
    },
    [save],
  );

  const update = useCallback(
    (item: NoteItem, changes: Partial<Pick<NoteItem, "name" | "link" | "parentId">>, ok?: string) =>
      save({ ...item, ...changes, updatedAt: new Date().toISOString() }, false, ok),
    [save],
  );

  const move = useCallback(
    (item: NoteItem, parentId: string, folderName: string) => update(item, { parentId }, `Moved “${item.name}” to ${folderName}`),
    [update],
  );

  /** Deletes an item; for a folder, everything inside it too. */
  const remove = useCallback(
    async (item: NoteItem) => {
      const ids = item.type === "FOLDER" ? [...descendantIds(items, item.id).reverse(), item.id] : [item.id];
      try {
        await deleteNotes(ids).unwrap();
        toast.success(`Deleted “${item.name}”`);
        return true;
      } catch (e) {
        toast.error(`Couldn't delete “${item.name}”`, { description: message(e) });
        return false;
      }
    },
    [items, deleteNotes],
  );

  return {
    items,
    missing: data?.missing ?? false,
    isLoading,
    error: error ? ("message" in error ? String(error.message) : "Couldn't load notes.") : null,
    writable,
    create,
    update,
    move,
    remove,
  };
}
