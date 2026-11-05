import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
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
  /** Optional full-width visual under the value, e.g. a StatusBar. */
  readonly footer?: ReactNode;
  /** Makes the whole card a button. */
  readonly onClick?: () => void;
  readonly className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "primary",
  aside,
  footer,
  onClick,
  className,
}: StatCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-3.5", TONE_CLASS[tone])}>
              {icon}
            </span>
          )}
          <span className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-fg-subtle sm:text-xs">{label}</span>
        </div>
        {onClick && (
          <ArrowUpRight className="size-4 shrink-0 text-fg-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
        )}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0 text-left">
          <p className="font-numbers text-2xl leading-none text-fg sm:text-3xl">{value}</p>
          {hint && <p className="mt-2 truncate text-xs text-fg-muted">{hint}</p>}
        </div>
        {aside}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </>
  );

  const base = "flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-5";

  if (!onClick) return <div className={cn(base, className)}>{content}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        "group w-full cursor-pointer text-left transition-all hover:-translate-y-0.5 hover:border-border-strong",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
        className,
      )}
    >
      {content}
    </button>
  );
}
