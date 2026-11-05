import { cn } from "../../lib/cn";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Lightweight SVG ring — no chart library needed. */
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
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span
          className="absolute font-numbers text-fg"
          style={{ fontSize: Math.max(10, Math.round(size * 0.22)) }}
        >
          {pct}%
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
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", pct === 100 ? "bg-success" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
