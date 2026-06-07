export const ProgressStatus = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
  NOT_STARTED: "NOT_STARTED",
} as const;

export type ProgressStatus = typeof ProgressStatus[keyof typeof ProgressStatus];
