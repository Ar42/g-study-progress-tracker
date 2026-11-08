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

/** One Study Log entry (a row of the "Study Log" tab). */
export interface LogEntry {
  readonly id: string;
  /** ISO date (yyyy-mm-dd) the study happened. */
  readonly date: string;
  readonly category: StudyDomain;
  /** BCS only. Name is a snapshot so old logs survive renames/deletes. */
  readonly subjectId: string;
  readonly subjectName: string;
  readonly topicId: string;
  readonly topicName: string;
  /** Optional study time in minutes. */
  readonly minutes: number | null;
  /** Markdown text. */
  readonly description: string;
  /** ISO timestamp, used to order entries within a day. */
  readonly createdAt: string;
  /** Set when the entry was created by finishing a timer session. */
  readonly sessionId: string;
}

/** A start/pause interval of a timer session (ISO timestamps; end null = running). */
export interface SessionSegment {
  readonly start: string;
  readonly end: string | null;
}

/** The active study timer (a row of the "Study Sessions" tab). */
export interface StudySession {
  readonly id: string;
  readonly category: StudyDomain;
  readonly subjectId: string;
  readonly subjectName: string;
  readonly topicId: string;
  readonly topicName: string;
  readonly segments: readonly SessionSegment[];
  readonly note: string;
  readonly updatedAt: string;
}

/** Study-time targets and preferences (the "Settings" tab, key → value). */
export interface StudySettings {
  readonly dailyTargetMinutes: number;
  readonly weeklyTargetMinutes: number;
  readonly confirmSessionOverMinutes: number;
}
