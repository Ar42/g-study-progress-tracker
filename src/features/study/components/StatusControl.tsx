import { Check, Circle, CircleDashed, Clock } from "lucide-react";
import { cn } from "../../../lib/cn";
import { ProgressStatus, type DisplayStatus, type StoredStatus } from "../../../enums/progress";

const OPTIONS: readonly {
  value: StoredStatus;
  label: string;
  icon: typeof Circle;
  active: string;
}[] = [
  { value: ProgressStatus.NOT_STARTED, label: "Not started", icon: CircleDashed, active: "bg-surface text-fg shadow-card" },
  { value: ProgressStatus.IN_PROGRESS, label: "In progress", icon: Clock, active: "bg-info-soft text-info" },
  { value: ProgressStatus.COMPLETED, label: "Done", icon: Check, active: "bg-success-soft text-success" },
];

export interface StatusControlProps {
  readonly status: DisplayStatus;
  readonly onChange: (status: StoredStatus) => void;
  readonly disabled?: boolean;
  /** Show text labels next to icons (hidden on very small screens). */
  readonly showLabels?: boolean;
}

/** Compact three-state switch used on every chapter/topic row. */
export function StatusControl({ status, onChange, disabled, showLabels = true }: StatusControlProps) {
  const current: StoredStatus = status === ProgressStatus.OVERDUE ? ProgressStatus.IN_PROGRESS : status;
  const overdue = status === ProgressStatus.OVERDUE;

  return (
    <div
      role="radiogroup"
      aria-label="Status"
      className="inline-flex shrink-0 items-center rounded-xl border border-border bg-surface-2/70 p-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      {OPTIONS.map(({ value, label, icon: Icon, active }) => {
        const selected = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={label}
            disabled={disabled}
            onClick={() => onChange(value)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
              selected
                ? overdue && value === ProgressStatus.IN_PROGRESS
                  ? "bg-danger-soft text-danger"
                  : active
                : "text-fg-subtle hover:bg-surface-3 hover:text-fg",
            )}
          >
            <Icon className="size-3.5" />
            {showLabels && <span className="hidden md:inline">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
