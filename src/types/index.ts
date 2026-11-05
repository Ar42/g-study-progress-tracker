import type { DisplayStatus, StoredStatus } from "../enums/progress";

export type StudyDomain = "BCS" | "IT";

export interface LinkItem {
  readonly title: string;
  readonly link: string;
  readonly sourceName: string;
}

/**
 * One row of the Google Sheet, normalised. This is the single source of truth;
 * trees and derived statuses are computed from it, never stored.
 */
export interface StudyRow {
  readonly id: string;
  readonly name: string;
  /** BCS only: id of the parent subject/folder. Empty for IT and for subjects. */
  readonly parentId: string;
  /** Status as stored in the sheet. Never OVERDUE (that is derived). */
  readonly status: StoredStatus;
  /** Original status cell text — written back untouched for subject rows. */
  readonly rawStatus: string;
  readonly preliMarks: string;
  readonly comments: string;
  /** ISO dates (yyyy-mm-dd) or "". */
  readonly startedDate: string;
  readonly targetDate: string;
  readonly completedDate: string;
  readonly links: readonly LinkItem[];
  /** Set when the sheet's links cell is not valid JSON; preserved on write. */
  readonly linksRaw: string | null;
  /** BCS only: TRUE marks a top-level subject. */
  readonly isSubject: boolean;
}

export interface ProgressStats {
  readonly completed: number;
  readonly total: number;
  readonly percentage: number;
}

/** A BCS row arranged in its hierarchy with derived values attached. */
export interface TreeNode {
  readonly row: StudyRow;
  readonly status: DisplayStatus;
  readonly children: readonly TreeNode[];
  readonly isLeaf: boolean;
  readonly stats: ProgressStats;
}

export interface Subject extends TreeNode {
  readonly marks: number;
}

/** An IT topic with its derived display status. */
export interface Topic {
  readonly row: StudyRow;
  readonly status: DisplayStatus;
}
