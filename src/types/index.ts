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
  /** Per weekend day (Fri & Sat). 0 = same as the weekday target. */
  readonly weekendTargetMinutes: number;
  readonly confirmSessionOverMinutes: number;
}

/** A folder or a link file in My Drive (a row of the "My Drive" tab). */
export interface NoteItem {
  readonly id: string;
  /** "" = top level. */
  readonly parentId: string;
  readonly type: "FOLDER" | "FILE";
  readonly name: string;
  /** Files only. */
  readonly link: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/* ------------------------------------------------------------ Exams */

export type ExamType = "IT" | "GENERAL";
export type ExamPriority = "HIGH" | "MEDIUM" | "LOW";

export interface ExamLink {
  readonly title: string;
  readonly url: string;
}

/** One row of the "Exams" tab. Dates are ISO yyyy-mm-dd ("" when unknown). */
export interface Exam {
  readonly id: string;
  readonly title: string;
  readonly organization: string;
  readonly type: ExamType;
  readonly priority: ExamPriority;
  readonly grade: string;
  readonly salaryMonthly: string;
  readonly salaryGross: string;
  readonly totalSeats: string;
  readonly seatsConfirmed: boolean;
  readonly circularDate: string;
  readonly website: string;
  readonly links: readonly ExamLink[];
  readonly applyDeadline: string;
  readonly applied: boolean;
  readonly examDate: string;
  /** "HH:mm" (24h) or "". */
  readonly examTime: string;
  readonly examDateEstimated: boolean;
  readonly centreName: string;
  readonly centreMap: string;
  readonly centreNotes: string;
  /** Encrypted on this device before saving (see lib/secretBox). */
  readonly credentials: string;
  readonly description: string;
  readonly hideOnDashboard: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}
