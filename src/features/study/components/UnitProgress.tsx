import { cn } from "../../../lib/cn";
import { unitLabel, unitPercent, visibleUnits } from "../../../lib/units";
import type { ProgressUnit } from "../../../types";

function Bar({ pct }: { readonly pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
      <div className={cn("h-full rounded-full transition-[width]", pct === 100 ? "bg-success" : "bg-primary")} style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Partial progress counters. `compact` is the one-line version for list rows;
 * the full version (details popup) shows a labelled bar per unit.
 * Purely informational — never feeds completion stats.
 */
export function UnitProgress({ units, compact = false, className }: { readonly units: readonly ProgressUnit[]; readonly compact?: boolean; readonly className?: string }) {
  const list = visibleUnits(units);
  if (list.length === 0) return null;

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-x-4 gap-y-1.5", className)}>
        {list.map((u, i) => {
          const pct = unitPercent(u);
          return (
            <div key={`${u.unit}-${i}`} className="flex w-44 max-w-full items-center gap-2" title={`${unitLabel(u)}: ${u.finished} of ${u.total} (${pct}%)`}>
              <span className="max-w-20 shrink-0 truncate text-[11px] font-medium text-fg-subtle">{unitLabel(u)}</span>
              <Bar pct={pct} />
              <span className={cn("shrink-0 font-numbers text-[11px]", pct === 100 ? "text-success" : "text-fg-muted")}>
                {Math.min(u.finished, u.total)}/{u.total}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ul className={cn("space-y-3", className)}>
      {list.map((u, i) => {
        const pct = unitPercent(u);
        return (
          <li key={`${u.unit}-${i}`} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium capitalize text-fg">{unitLabel(u)}</span>
              <span className="font-numbers text-fg-muted">
                <span className={pct === 100 ? "text-success" : "text-fg"}>{Math.min(u.finished, u.total)}</span> / {u.total}
                <span className="ml-2 text-xs text-fg-subtle">{pct}%</span>
              </span>
            </div>
            <Bar pct={pct} />
          </li>
        );
      })}
    </ul>
  );
}
