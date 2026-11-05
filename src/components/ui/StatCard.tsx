import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { TONE_CLASS, type Tone } from "./styles";

export interface StatCardProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  readonly icon?: ReactNode;
  readonly tone?: Tone;
  /** Optional right-side visual, e.g. a ProgressRing. */
  readonly aside?: ReactNode;
  /** Makes the whole card a button (shows a chevron when no `aside`). */
  readonly onClick?: () => void;
  readonly className?: string;
}

export function StatCard({ label, value, hint, icon, tone = "primary", aside, onClick, className }: StatCardProps) {
  const content = (
    <>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-4.5",
              TONE_CLASS[tone],
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 text-left">
          <p className="text-xs font-medium text-fg-subtle">{label}</p>
          <p className="mt-0.5 font-numbers text-xl text-fg">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-fg-subtle">{hint}</p>}
        </div>
      </div>
      {aside ??
        (onClick && (
          <ChevronRight className="size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
        ))}
    </>
  );

  const base = "flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4";

  if (!onClick) return <div className={cn(base, className)}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        "group w-full cursor-pointer transition-colors hover:border-border-strong hover:bg-surface-2",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        className,
      )}
    >
      {content}
    </button>
  );
}
