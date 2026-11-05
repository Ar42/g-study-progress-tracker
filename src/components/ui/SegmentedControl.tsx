import { cn } from "../../lib/cn";

export interface Segment<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

export interface SegmentedControlProps<T extends string> {
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly segments: readonly Segment<T>[];
  readonly ariaLabel: string;
  readonly className?: string;
}

/** Pill-style tab group; scrolls horizontally on narrow screens. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface-2/70 p-1 [scrollbar-width:none]",
        className,
      )}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(s.value)}
            className={cn(
              "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors",
              active ? "bg-surface text-fg shadow-card" : "text-fg-subtle hover:text-fg",
            )}
          >
            {s.label}
            {s.count !== undefined && (
              <span className={cn("tabular-nums", active ? "text-fg-muted" : "text-fg-subtle/80")}>{s.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
