import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-border bg-primary-soft text-primary [&_svg]:size-5">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-subtle">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
