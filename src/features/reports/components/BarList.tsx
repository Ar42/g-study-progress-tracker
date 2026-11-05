import { CheckCircle2 } from "lucide-react";
import { cn } from "../../../lib/cn";

export interface BarListItem {
  readonly key: string;
  readonly label: string;
  readonly value: number; // 0–100
  readonly detail: string;
}

/**
 * Horizontal, directly-labelled bars: long (Bengali) labels stay readable and
 * every value is printed as text, so the chart doubles as its own table.
 */
export function BarList({ items }: { readonly items: readonly BarListItem[] }) {
  return (
    <ul className="space-y-3.5">
      {items.map((it) => {
        const done = it.value >= 100;
        return (
          <li key={it.key} title={`${it.label}: ${it.value}% (${it.detail})`} className="group">
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-fg-muted group-hover:text-fg">{it.label}</span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-fg-subtle">
                {done && <CheckCircle2 className="size-3.5 text-success" aria-label="Complete" />}
                {it.detail}
                <span className="w-10 text-right font-numbers text-fg">{it.value}%</span>
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-3">
              <div
                className={cn("h-full rounded-full bg-primary transition-[width] duration-700 group-hover:bg-primary-hover")}
                style={{ width: `${Math.max(it.value, it.value > 0 ? 2 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
