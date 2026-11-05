import { ProgressStatus, STATUS_META, type DisplayStatus } from "../../../enums/progress";
import { cn } from "../../../lib/cn";

const ORDER: readonly DisplayStatus[] = [
  ProgressStatus.COMPLETED,
  ProgressStatus.IN_PROGRESS,
  ProgressStatus.OVERDUE,
  ProgressStatus.NOT_STARTED,
];

const FILL: Record<DisplayStatus, string> = {
  COMPLETED: "bg-success",
  IN_PROGRESS: "bg-warning",
  OVERDUE: "bg-danger",
  NOT_STARTED: "bg-neutral/50",
};

/** One stacked bar + a labelled legend with counts and shares. */
export function StatusBreakdown({ counts }: { readonly counts: Record<DisplayStatus, number> }) {
  const total = ORDER.reduce((n, s) => n + counts[s], 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-5">
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-surface-3">
        {ORDER.filter((s) => counts[s] > 0).map((s) => (
          <div
            key={s}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", FILL[s])}
            style={{ width: `${(counts[s] / total) * 100}%` }}
            title={`${STATUS_META[s].label}: ${counts[s]}`}
          />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ORDER.map((s) => (
          <div key={s} className="rounded-lg border border-border bg-surface-2/40 px-3 py-2.5">
            <dt className="flex items-center gap-1.5 text-xs text-fg-subtle">
              <span className={cn("size-2 rounded-full", FILL[s])} />
              {STATUS_META[s].label}
            </dt>
            <dd className="mt-1 flex items-baseline gap-1.5">
              <span className="font-numbers text-lg text-fg">{counts[s]}</span>
              <span className="text-xs text-fg-subtle">{pct(counts[s])}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
