import { cn } from "../../lib/cn";

export interface DonutProps {
  readonly met: number;
  readonly missed: number;
  readonly title: string;
  /** What one unit is called: "day"/"days", "week"/"weeks". */
  readonly unit: [singular: string, plural: string];
  readonly size?: number;
  readonly className?: string;
}

/**
 * Two-part ring: met (green) vs missed (red), percentage met in the middle.
 * Counts are printed in the legend, so colour never carries meaning alone.
 */
export function Donut({ met, missed, title, unit, size = 132, className }: DonutProps) {
  const total = met + missed;
  const pct = total ? Math.round((met / total) * 100) : 0;
  const stroke = Math.max(10, Math.round(size * 0.12));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const metLen = total ? (met / total) * c : 0;
  // A 2px surface gap between the two parts when both exist.
  const gap = met && missed ? 2 : 0;
  const word = (n: number) => (n === 1 ? unit[0] : unit[1]);

  return (
    <figure className={cn("flex flex-col items-center gap-3", className)}>
      <figcaption className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</figcaption>
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${title}: ${met} met, ${missed} missed (${pct}% met)`}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth={stroke} />
          {missed > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--c-danger)"
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, c - metLen - gap * 2)} ${c}`}
              strokeDashoffset={-(metLen + gap)}
            />
          )}
          {met > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--c-success)"
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, metLen - (missed ? gap : 0))} ${c}`}
              className="transition-[stroke-dasharray] duration-700"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {total ? (
            <>
              <span className="font-numbers text-2xl text-fg">{pct}%</span>
              <span className="text-[11px] text-fg-subtle">met</span>
            </>
          ) : (
            <span className="px-4 text-center text-xs text-fg-subtle">Nothing to rate yet</span>
          )}
        </div>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-fg-muted">
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success" />
          Met <span className="font-numbers text-fg">{met}</span> {word(met)}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-danger" />
          Missed <span className="font-numbers text-fg">{missed}</span> {word(missed)}
        </li>
      </ul>
    </figure>
  );
}
