import { cn } from "../../../lib/cn";
import { formatMinutes } from "../../../lib/duration";

export interface TimeBar {
  readonly key: string;
  /** Short axis label ("Sat", "12", "Jan"). */
  readonly label: string;
  /** Full label for the tooltip ("Saturday, 8 Nov"). */
  readonly title: string;
  readonly minutes: number;
  /** Visually de-emphasise (future days). */
  readonly muted?: boolean;
  /** Outline the current day/month. */
  readonly current?: boolean;
}

export interface TimeBarsProps {
  readonly bars: readonly TimeBar[];
  /** Per-bar target in minutes (dashed line); omit for none. */
  readonly target?: number | null;
  readonly targetLabel?: string;
  /** Show every Nth axis label (long ranges). */
  readonly labelEvery?: number;
  readonly height?: number;
}

/**
 * Single-series column chart of study minutes. One hue; the target is a dashed
 * line; exact values appear on hover/focus and in each bar's accessible label,
 * so the colour never carries meaning on its own.
 */
export function TimeBars({ bars, target, targetLabel = "Target", labelEvery = 1, height = 180 }: TimeBarsProps) {
  const max = Math.max(1, ...bars.map((b) => b.minutes), target ?? 0) * 1.12;
  const targetPct = target ? (target / max) * 100 : null;

  return (
    <figure className="w-full">
      <div className="relative" style={{ height }}>
        {/* baseline + target line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-border-strong" />
        {targetPct !== null && (
          <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-fg-subtle/70" style={{ bottom: `${targetPct}%` }}>
            <span className="absolute -top-5 right-0 rounded bg-surface px-1 text-[11px] font-medium text-fg-subtle">
              {targetLabel} {formatMinutes(target!)}
            </span>
          </div>
        )}

        <ol className="absolute inset-0 flex items-end gap-[2px]" aria-label="Study time chart">
          {bars.map((b) => {
            const pct = (b.minutes / max) * 100;
            const met = target ? b.minutes >= target : false;
            return (
              <li
                key={b.key}
                tabIndex={0}
                aria-label={`${b.title}: ${b.minutes > 0 ? formatMinutes(b.minutes) : "nothing logged"}${met ? ", target met" : ""}`}
                className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center outline-none"
              >
                <div
                  className={cn(
                    "w-full max-w-10 rounded-t-[4px] transition-colors",
                    b.muted ? "bg-surface-3" : "bg-primary/75 group-hover:bg-primary group-focus-visible:bg-primary",
                    b.current && "ring-2 ring-primary/40 ring-offset-1 ring-offset-surface",
                  )}
                  style={{ height: b.minutes > 0 ? `max(${pct}%, 3px)` : 0 }}
                />
                {/* hover / focus tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-center whitespace-nowrap shadow-pop group-hover:block group-focus-visible:block">
                  <p className="text-[11px] text-fg-subtle">{b.title}</p>
                  <p className="font-numbers text-sm text-fg">{b.minutes > 0 ? formatMinutes(b.minutes) : "—"}</p>
                  {met && <p className="text-[11px] font-semibold text-success">✓ target met</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mt-1.5 flex gap-[2px]">
        {bars.map((b, i) => (
          <span
            key={b.key}
            className={cn("min-w-0 flex-1 truncate text-center text-[11px] text-fg-subtle", b.current && "font-semibold text-fg")}
            aria-hidden
          >
            {i % labelEvery === 0 || b.current ? b.label : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}
