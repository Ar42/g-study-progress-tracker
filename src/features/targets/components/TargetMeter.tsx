import { Badge } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { formatMinutes } from "../../../lib/duration";
import { rate, type Rating } from "../../../lib/studyCalendar";

const FILL: Record<Rating["tone"], string> = {
  success: "bg-success",
  primary: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function RatingBadge({ actual, target, pace }: { readonly actual: number; readonly target: number; readonly pace?: boolean }) {
  const r = rate(actual, target);
  if (!r) return null;
  return (
    <Badge tone={r.tone} title={pace ? "Compared with the target for the days so far" : undefined}>
      {r.label} · {r.pct}%{pace ? " on pace" : ""}
    </Badge>
  );
}

export interface TargetMeterProps {
  readonly label: string;
  readonly actual: number;
  /** Full target for the period (null = no target set). */
  readonly target: number | null;
  /** Target for the days elapsed so far; rating uses this when the period isn't over. */
  readonly targetToDate?: number;
  readonly extra?: string;
}

/** "Today  1h 20m / 3h  [Poor · 44%]" with a progress bar coloured by rating. */
export function TargetMeter({ label, actual, target, targetToDate, extra }: TargetMeterProps) {
  const judgeBy = targetToDate !== undefined && target !== null && targetToDate < target ? targetToDate : target;
  const r = target ? rate(actual, judgeBy ?? 0) : null;
  const pct = target ? Math.min(100, (actual / target) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</p>
        {target ? <RatingBadge actual={actual} target={judgeBy ?? target} pace={judgeBy !== target} /> : null}
      </div>
      <p className="text-sm text-fg-muted">
        <span className="font-numbers text-2xl text-fg">{formatMinutes(actual)}</span>
        {target ? <span> / {formatMinutes(target)}</span> : <span className="ml-1 text-xs">no target</span>}
        {extra && <span className="ml-1 text-xs text-fg-subtle">{extra}</span>}
      </p>
      {target ? (
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-surface-3"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${Math.round((actual / target) * 100)}% of target`}
        >
          <div className={cn("h-full rounded-full transition-[width] duration-700", r ? FILL[r.tone] : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}
