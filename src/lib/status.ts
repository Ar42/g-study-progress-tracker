import { ProgressStatus, type DisplayStatus, type StoredStatus } from "../enums/progress";
import type { StudyRow } from "../types";
import { todayISO } from "./date";

/** Maps a raw sheet cell to a stored status. A legacy "OVERDUE" cell is really "in progress". */
export function parseStoredStatus(raw: string): StoredStatus {
  switch (raw.trim().toUpperCase()) {
    case "COMPLETED":
      return ProgressStatus.COMPLETED;
    case "IN_PROGRESS":
    case "OVERDUE":
      return ProgressStatus.IN_PROGRESS;
    default:
      return ProgressStatus.NOT_STARTED;
  }
}

/** The status the UI shows: in-progress rows past their target date are overdue. */
export function getDisplayStatus(row: StudyRow, today: string = todayISO()): DisplayStatus {
  if (row.status === ProgressStatus.IN_PROGRESS && row.targetDate && today > row.targetDate) {
    return ProgressStatus.OVERDUE;
  }
  return row.status;
}

/** Applies a status change along with the date bookkeeping that goes with it. */
export function withStatus(row: StudyRow, next: StoredStatus, today: string = todayISO()): StudyRow {
  switch (next) {
    case ProgressStatus.COMPLETED:
      return {
        ...row,
        status: next,
        startedDate: row.startedDate || today,
        completedDate: today,
      };
    case ProgressStatus.IN_PROGRESS:
      return { ...row, status: next, startedDate: row.startedDate || today, completedDate: "" };
    default:
      return { ...row, status: next, startedDate: "", completedDate: "" };
  }
}
