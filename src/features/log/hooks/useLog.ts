import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  useCreateLogMutation,
  useDeleteLogMutation,
  useGetLogQuery,
  useUpdateLogMutation,
} from "../../../services/studyApi";
import { findNode } from "../../../lib/tree";
import type { LogEntry } from "../../../types";
import { useSubjects, useTopics } from "../../study/hooks/useStudyData";
import type { EntryNames } from "../logStats";

const EMPTY: LogEntry[] = [];

export function useLogEntries() {
  const { data, isLoading, isFetching, error } = useGetLogQuery();
  return {
    entries: data?.entries ?? EMPTY,
    missing: data?.missing ?? false,
    isLoading,
    isFetching,
    error: error ? ("message" in error ? String(error.message) : "Couldn't load the study log.") : null,
  };
}

/**
 * Resolves an entry's subject/topic to their *current* names (so renames show
 * up), falling back to the names saved with the entry if they were deleted.
 */
export function useEntryNames(): (e: LogEntry) => EntryNames & { exists: boolean } {
  const { subjects } = useSubjects();
  const { topics } = useTopics();

  return useMemo(() => {
    const subjectById = new Map(subjects.map((s) => [s.row.id, s]));
    const topicById = new Map(topics.map((t) => [t.row.id, t]));
    return (e: LogEntry) => {
      if (e.category === "IT") {
        const t = topicById.get(e.topicId);
        return { subject: "IT", topic: t?.row.name ?? e.topicName, exists: Boolean(t) };
      }
      const s = subjectById.get(e.subjectId);
      const node = s ? findNode(s.children, e.topicId) : null;
      return {
        subject: s?.row.name ?? e.subjectName,
        topic: node?.row.name ?? e.topicName,
        exists: Boolean(node),
      };
    };
  }, [subjects, topics]);
}

const message = (e: unknown) =>
  (typeof e === "object" && e && "message" in e && typeof e.message === "string" && e.message) ||
  "Could not save to Google Sheet.";

export function useLogActions() {
  const [createLog] = useCreateLogMutation();
  const [updateLog] = useUpdateLogMutation();
  const [deleteLog] = useDeleteLogMutation();

  const run = useCallback(async (p: Promise<unknown>, ok: string, fail: string) => {
    try {
      await p;
      toast.success(ok);
      return true;
    } catch (e) {
      toast.error(fail, { description: message(e) });
      return false;
    }
  }, []);

  return {
    create: useCallback((e: LogEntry) => run(createLog(e).unwrap(), "Study logged", "Couldn't save the log entry"), [createLog, run]),
    update: useCallback((e: LogEntry) => run(updateLog(e).unwrap(), "Log entry updated", "Couldn't update the log entry"), [updateLog, run]),
    remove: useCallback((e: LogEntry) => run(deleteLog(e.id).unwrap(), "Log entry deleted", "Couldn't delete the log entry"), [deleteLog, run]),
  };
}
