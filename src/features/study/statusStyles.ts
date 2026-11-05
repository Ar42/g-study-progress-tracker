import { cn } from "../../lib/cn";
import type { DisplayStatus } from "../../enums/progress";

/**
 * One place that decides how a status *looks* on a list row, so every list
 * (chapter tree, IT topics, …) reads the same at a glance:
 *   in progress → amber rail + tint + clock     overdue → red rail + tint + alert
 *   completed   → green check, muted text        not started → plain, dashed circle
 */
export const STATUS_ROW: Record<DisplayStatus, { row: string; name: string; icon: string }> = {
  IN_PROGRESS: {
    row: "bg-info-soft before:bg-info",
    name: "font-semibold text-fg",
    icon: "text-info",
  },
  OVERDUE: {
    row: "bg-danger-soft before:bg-danger",
    name: "font-semibold text-danger",
    icon: "text-danger",
  },
  COMPLETED: {
    row: "before:bg-success/0",
    name: "text-fg-muted line-through decoration-fg-subtle/50",
    icon: "text-success",
  },
  NOT_STARTED: {
    row: "before:bg-transparent",
    name: "text-fg",
    icon: "text-fg-subtle/60",
  },
};

/** Classes for the row container: a left status rail (via ::before) and a tint for active rows. */
export function statusRowClass(status: DisplayStatus): string {
  return cn(
    "before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-full",
    STATUS_ROW[status].row,
  );
}

export function statusNameClass(status: DisplayStatus): string {
  return STATUS_ROW[status].name;
}

