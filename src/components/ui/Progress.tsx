import { cn } from "../../lib/cn";
import { TONE_FILL, type Tone } from "./styles";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Lightweight SVG ring. Turns leaf-green at 100%. */
export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  className,
  showLabel = true,
}: {
  readonly value: number;
  readonly size?: number;
  readonly stroke?: number;
  readonly className?: string;
  readonly showLabel?: boolean;
}) {
  const pct = clamp(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = pct === 100 ? "var(--c-success)" : "var(--c-primary)";

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${pct}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute font-numbers text-fg" style={{ fontSize: Math.max(11, Math.round(size * 0.24)) }}>
          {pct}
          <span className="text-[0.6em] text-fg-subtle">%</span>
        </span>
      )}
    </div>
  );
}

export function ProgressBar({ value, className }: { readonly value: number; readonly className?: string }) {
  const pct = clamp(value);
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", pct === 100 ? "bg-success" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export interface StatusSegment {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly tone: Tone;
}

/**
 * Stacked bar of status counts (done / reading / overdue / not started).
 * Shows *how* progress is split, not just a single percentage.
 */
export function StatusBar({
  segments,
  className,
  height = "h-2",
}: {
  readonly segments: readonly StatusSegment[];
  readonly className?: string;
  readonly height?: string;
}) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const label = segments.map((s) => `${s.label}: ${s.value}`).join(", ");
  return (
    <div
      className={cn("flex w-full gap-[2px] overflow-hidden rounded-full bg-surface-3", height, className)}
      role="img"
      aria-label={label}
      title={label}
    >
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <div
              key={s.key}
              className={cn("h-full transition-[width] duration-1000 ease-out first:rounded-l-full last:rounded-r-full", TONE_FILL[s.tone])}
              style={{ width: `${(s.value / total) * 100}%` }}
            />
          ))}
    </div>
  );
}
