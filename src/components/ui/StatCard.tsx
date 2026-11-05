import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card } from "./Card";
import { TONE_CLASS, type Tone } from "./styles";

export interface StatCardProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  readonly icon?: ReactNode;
  readonly tone?: Tone;
  /** Optional right-side visual, e.g. a ProgressRing. */
  readonly aside?: ReactNode;
  readonly className?: string;
}

export function StatCard({ label, value, hint, icon, tone = "primary", aside, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-center justify-between gap-4 p-4", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-[18px]",
              TONE_CLASS[tone],
            )}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-fg-subtle">{label}</p>
          <p className="mt-0.5 font-numbers text-xl text-fg">{value}</p>
          {hint && <p className="mt-0.5 truncate text-xs text-fg-subtle">{hint}</p>}
        </div>
      </div>
      {aside}
    </Card>
  );
}
