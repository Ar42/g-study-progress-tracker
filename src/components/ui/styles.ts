import { cn } from "../../lib/cn";

/** Shared look for every text-like control so they line up perfectly. */
export const controlClass = cn(
  "w-full rounded-xl border border-border bg-surface-2/70 px-3.5 text-sm text-fg placeholder:text-fg-subtle/80",
  "transition-[border-color,box-shadow,background-color] hover:border-border-strong",
  "focus:outline-none focus:border-primary/70 focus:bg-surface focus:ring-4 focus:ring-primary/15",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/15",
);

/** Soft tinted chip classes per semantic tone. Literal strings so Tailwind can see them. */
export const TONE_CLASS = {
  success: "bg-success-soft text-success border-success/20",
  info: "bg-info-soft text-info border-info/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
  neutral: "bg-neutral-soft text-neutral border-neutral/15",
  primary: "bg-primary-soft text-primary border-primary/20",
} as const;

export type Tone = keyof typeof TONE_CLASS;

export const TONE_TEXT: Record<Tone, string> = {
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
  danger: "text-danger",
  neutral: "text-neutral",
  primary: "text-primary",
};

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral",
  primary: "bg-primary",
};

/** Solid fills for status segments (progress bars, legends). */
export const TONE_FILL: Record<Tone, string> = {
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
  neutral: "bg-neutral/35",
  primary: "bg-primary",
};
