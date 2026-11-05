import { useMemo } from "react";
import { useGetRowsQuery } from "../../../services/studyApi";
import { buildSubjects, buildTopics } from "../../../lib/tree";
import { todayISO } from "../../../lib/date";
import type { StudyRow, Subject, Topic } from "../../../types";

const EMPTY: StudyRow[] = [];

export function useBcsRows() {
  return useGetRowsQuery("BCS");
}

export function useItRows() {
  return useGetRowsQuery("IT");
}

/** BCS subjects as a tree with derived (overdue-aware) statuses. */
export function useSubjects(): { subjects: Subject[]; rows: readonly StudyRow[] } {
  const { data } = useBcsRows();
  const rows = data ?? EMPTY;
  const subjects = useMemo(() => buildSubjects(rows, todayISO()), [rows]);
  return { subjects, rows };
}

export function useTopics(): { topics: Topic[]; isLoading: boolean; error: unknown } {
  const { data, isLoading, error } = useItRows();
  const rows = data ?? EMPTY;
  const topics = useMemo(() => buildTopics(rows, todayISO()), [rows]);
  return { topics, isLoading, error };
}
