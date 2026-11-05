import { cn } from "../../lib/cn";

/** App mark: a progress ring with a check. Mirrors public/favicon.svg, but follows the theme accent. */
export function Logo({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("size-9 shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="15" fill="var(--c-primary)" />
      <g stroke="var(--c-primary-fg)" fill="none" strokeWidth="5" strokeLinecap="round">
        <circle cx="32" cy="32" r="17" strokeOpacity="0.3" />
        <circle cx="32" cy="32" r="17" strokeDasharray="80.1 106.8" transform="rotate(-90 32 32)" />
        <path d="M24.5 32.5l5.2 5.2 10-10.4" strokeWidth="4.6" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
