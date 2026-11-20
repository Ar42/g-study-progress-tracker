import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { EXAMS_SCRIPT_VERSION } from "../../../config/constants";
import { useDeleteExamMutation, useGetExamsQuery, useSaveExamMutation } from "../../../services/studyApi";
import { useSyncStatus } from "../../../services/syncStatus";
import type { Exam } from "../../../types";
import { sortExams } from "../examLogic";

const EMPTY: Exam[] = [];
const message = (e: unknown) =>
  (typeof e === "object" && e && "message" in e && typeof e.message === "string" && e.message) || "Couldn't save to Google Sheet.";

/** Exams sorted by importance, plus save / delete / hide-from-dashboard. */
export function useExams() {
  const { data, isLoading, isFetching, error, refetch } = useGetExamsQuery();
  const scriptVersion = useSyncStatus((s) => s.scriptVersion);
  const [saveExam] = useSaveExamMutation();
  const [deleteExam] = useDeleteExamMutation();

  const exams = useMemo(() => sortExams(data?.exams ?? EMPTY), [data]);
  const writable = (scriptVersion ?? 0) >= EXAMS_SCRIPT_VERSION;

  const save = useCallback(
    async (exam: Exam, isNew: boolean, ok?: string) => {
      try {
        await saveExam({ exam: { ...exam, updatedAt: new Date().toISOString() }, isNew }).unwrap();
        if (ok) toast.success(ok);
        return true;
      } catch (e) {
        toast.error(isNew ? `Couldn't add “${exam.title}”` : `Couldn't save “${exam.title}”`, { description: message(e) });
        return false;
      }
    },
    [saveExam],
  );

  const remove = useCallback(
    async (exam: Exam) => {
      try {
        await deleteExam(exam.id).unwrap();
        toast.success(`Deleted “${exam.title}”`);
        return true;
      } catch (e) {
        toast.error(`Couldn't delete “${exam.title}”`, { description: message(e) });
        return false;
      }
    },
    [deleteExam],
  );

  const setHidden = useCallback(
    (exam: Exam, hideOnDashboard: boolean) =>
      save({ ...exam, hideOnDashboard }, false, hideOnDashboard ? `“${exam.title}” hidden from the dashboard` : `“${exam.title}” shown on the dashboard`),
    [save],
  );

  return {
    exams,
    isLoading,
    isFetching,
    refetch,
    error: error ? ("message" in error ? String(error.message) : "Couldn't load exams.") : null,
    writable,
    save,
    remove,
    setHidden,
  };
}
