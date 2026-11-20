import { cn } from "../../lib/cn";

/** Small inline "working" indicator: three softly pulsing dots (used in buttons and the sync status). */
export function Spinner({ className }: { readonly className?: string }) {
  return (
    <span role="status" aria-label="Loading" className={cn("inline-flex h-4 items-center gap-[3px]", className)}>
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-1 animate-dot rounded-full bg-current" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}
