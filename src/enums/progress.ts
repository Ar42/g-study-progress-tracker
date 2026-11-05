export const ProgressStatus = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  OVERDUE: "OVERDUE",
} as const;

/** Every status the UI can show. */
export type DisplayStatus = (typeof ProgressStatus)[keyof typeof ProgressStatus];

/** Statuses that may be persisted to the sheet. OVERDUE is derived, never stored. */
export type StoredStatus = Exclude<DisplayStatus, "OVERDUE">;

export const STORED_STATUSES: readonly StoredStatus[] = [
  ProgressStatus.NOT_STARTED,
  ProgressStatus.IN_PROGRESS,
  ProgressStatus.COMPLETED,
];

export type StatusFilter = DisplayStatus | "ALL";

export interface StatusMeta {
  readonly label: string;
  /** Tailwind token suffix: text-{tone}, bg-{tone}-soft, border-{tone}/30 */
  readonly tone: "success" | "warning" | "danger" | "neutral";
}

export const STATUS_META: Record<DisplayStatus, StatusMeta> = {
  NOT_STARTED: { label: "Not started", tone: "neutral" },
  IN_PROGRESS: { label: "In progress", tone: "warning" },
  COMPLETED: { label: "Completed", tone: "success" },
  OVERDUE: { label: "Overdue", tone: "danger" },
};

export const STATUS_FILTER_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: ProgressStatus.OVERDUE, label: STATUS_META.OVERDUE.label },
  { value: ProgressStatus.IN_PROGRESS, label: STATUS_META.IN_PROGRESS.label },
  { value: ProgressStatus.NOT_STARTED, label: STATUS_META.NOT_STARTED.label },
  { value: ProgressStatus.COMPLETED, label: STATUS_META.COMPLETED.label },
];
