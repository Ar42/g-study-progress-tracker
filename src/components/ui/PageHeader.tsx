import type { ReactNode } from "react";

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly eyebrow?: ReactNode;
  readonly actions?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <div className="flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</div>}
        <h1 className="font-display text-3xl font-semibold leading-tight text-fg wrap-break-word sm:text-4xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
