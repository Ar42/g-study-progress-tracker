import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

/** A shimmering placeholder block. Size it with classes (h-4 w-32, size-10 …). */
export function Skeleton({ className, style }: { readonly className?: string; readonly style?: CSSProperties }) {
  return <span aria-hidden style={style} className={cn("block animate-shimmer rounded-md bg-surface-3", className)} />;
}

/** Screen-reader text for a loading region (the shimmer itself is decorative). */
function Loading({ label }: { readonly label: string }) {
  return <span className="sr-only" role="status">{label}</span>;
}

/** Placeholder for a row of StatCards. */
export function StatCardsSkeleton({ count = 4, className, label = "Loading" }: { readonly count?: number; readonly className?: string; readonly label?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", className)}>
      <Loading label={label} />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-lg" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="mt-4 h-7 w-24" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Varied widths so rows don't look like a barcode. */
const TITLE_WIDTHS = ["w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-3/5"];

/** Placeholder list rows: icon, title line, sub-line, trailing control. */
export function ListSkeleton({ rows = 6, label = "Loading", trailing = true }: { readonly rows?: number; readonly label?: string; readonly trailing?: boolean }) {
  return (
    <ul className="divide-y divide-border">
      <li className="sr-only">
        <Loading label={label} />
      </li>
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
          <Skeleton className="size-5 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn("h-3.5", TITLE_WIDTHS[i % TITLE_WIDTHS.length])} />
            <Skeleton className="h-3 w-1/3" />
          </div>
          {trailing && <Skeleton className="hidden h-7 w-40 rounded-xl sm:block" />}
        </li>
      ))}
    </ul>
  );
}

/** Placeholder for a whole page: title, stat cards and a list card. */
export function PageSkeleton({ label = "Loading" }: { readonly label?: string }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <StatCardsSkeleton label={label} />
      <div className="rounded-xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-5 py-4">
          <Skeleton className="h-4 w-36" />
        </div>
        <ListSkeleton rows={5} label={label} />
      </div>
    </div>
  );
}
