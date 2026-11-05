import { cn } from "../../lib/cn";

/** Shared look for every text-like control so they line up perfectly. */
export const controlClass = cn(
  "w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-fg placeholder:text-fg-subtle",
  "transition-colors hover:border-border-strong",
  "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/25",
);

/** Soft tinted chip classes per semantic tone. Literal strings so Tailwind can see them. */
export const TONE_CLASS = {
  success: "bg-success-soft text-success border-success/25",
  warning: "bg-warning-soft text-warning border-warning/25",
  danger: "bg-danger-soft text-danger border-danger/25",
  neutral: "bg-neutral-soft text-neutral border-neutral/20",
  primary: "bg-primary-soft text-primary border-primary/25",
} as const;

export type Tone = keyof typeof TONE_CLASS;

export const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-neutral",
  primary: "text-primary",
};

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
  primary: "bg-primary",
};
