import { StatusBar, TONE_FILL } from "../../../components/ui";
import type { DisplayStatus } from "../../../enums/progress";
import { cn } from "../../../lib/cn";
import { statusSegments } from "../../study/statusSegments";

/** One stacked bar + a labelled legend with counts and shares. */
export function StatusBreakdown({ counts }: { readonly counts: Record<DisplayStatus, number> }) {
  const segments = statusSegments(counts);
  const total = segments.reduce((n, s) => n + s.value, 0);
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-5">
      <StatusBar segments={segments} height="h-3" />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {segments.map((s) => (
          <div key={s.key} className="rounded-xl border border-border bg-surface-2/50 px-3.5 py-3">
            <dt className="flex items-center gap-1.5 text-xs font-medium text-fg-subtle">
              <span className={cn("size-2 rounded-full", TONE_FILL[s.tone])} />
              {s.label}
            </dt>
            <dd className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-numbers text-2xl text-fg">{s.value}</span>
              <span className="text-xs text-fg-subtle">{pct(s.value)}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
