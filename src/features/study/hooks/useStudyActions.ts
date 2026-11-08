import { useCallback } from "react";
import { toast } from "sonner";
import {
  useCreateRowMutation,
  useDeleteRowMutation,
  useSwapRowsMutation,
  useUpdateRowMutation,
} from "../../../services/studyApi";
import { withStatus } from "../../../lib/status";
import { STATUS_META, type StoredStatus } from "../../../enums/progress";
import type { StudyDomain, StudyRow } from "../../../types";

const errorMessage = (e: unknown) =>
  (typeof e === "object" && e && "message" in e && typeof e.message === "string" && e.message) ||
  "Could not save to Google Sheet.";

/**
 * All write operations for a domain. Each one updates the UI instantly
 * (optimistic) and reverts with an error toast if the sheet rejects it.
 * Returned promises resolve to `true` on success.
 */
export function useStudyActions(domain: StudyDomain) {
  const [createRow] = useCreateRowMutation();
  const [updateRow] = useUpdateRowMutation();
  const [deleteRow] = useDeleteRowMutation();
  const [swapRows] = useSwapRowsMutation();

  const run = useCallback(async (promise: Promise<unknown>, success?: string, failure?: string) => {
    try {
      await promise;
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(failure ?? "Change reverted", { description: errorMessage(e) });
      return false;
    }
  }, []);

  const create = useCallback(
    (row: StudyRow) =>
      run(createRow({ domain, row }).unwrap(), `Added “${row.name}”`, `Couldn't add “${row.name}”`),
    [createRow, domain, run],
  );

  /**
   * Adds several rows with a single summary toast. All rows appear instantly;
   * the writes go to the sheet one after another (CREATE only appends rows).
   * Resolves to the number of rows saved.
   */
  const createMany = useCallback(
    async (rows: readonly StudyRow[]) => {
      const results = await Promise.allSettled(rows.map((row) => createRow({ domain, row }).unwrap()));
      const failed = results.filter((r) => r.status === "rejected");
      const saved = rows.length - failed.length;
      if (failed.length === 0) {
        toast.success(`Added ${saved} ${saved === 1 ? "chapter" : "chapters"}`);
      } else {
        toast.error(`${failed.length} of ${rows.length} couldn't be added`, {
          description: errorMessage((failed[0] as PromiseRejectedResult).reason),
        });
      }
      return saved;
    },
    [createRow, domain],
  );

  const update = useCallback(
    (row: StudyRow, success: string | null = "Changes saved") =>
      run(updateRow({ domain, row }).unwrap(), success ?? undefined, `Couldn't save “${row.name}”`),
    [updateRow, domain, run],
  );

  const setStatus = useCallback(
    (row: StudyRow, status: StoredStatus) => {
      if (row.status === status) return Promise.resolve(true);
      // No success toast: the row updates instantly and the top bar shows sync state.
      return run(
        updateRow({ domain, row: withStatus(row, status) }).unwrap(),
        undefined,
        `Couldn't mark “${row.name}” as ${STATUS_META[status].label.toLowerCase()}`,
      );
    },
    [updateRow, domain, run],
  );

  const remove = useCallback(
    (row: StudyRow) =>
      run(deleteRow({ domain, id: row.id }).unwrap(), `Deleted “${row.name}”`, `Couldn't delete “${row.name}”`),
    [deleteRow, domain, run],
  );

  const swap = useCallback(
    (id1: string, id2: string) => run(swapRows({ domain, id1, id2 }).unwrap(), undefined, "Couldn't reorder"),
    [swapRows, domain, run],
  );

  return { create, createMany, update, setStatus, remove, swap };
}
