import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-fg shadow-[0_1px_0_0_rgb(255_255_255/0.25)_inset,0_6px_16px_-6px_var(--c-primary)] hover:bg-primary-hover",
  secondary: "border border-border bg-surface text-fg shadow-card hover:border-border-strong hover:bg-surface-2",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger-solid text-white hover:brightness-110",
  soft: "bg-primary-soft text-primary hover:bg-primary/20",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
};

export interface ButtonProps extends ComponentProps<"button"> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly icon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-all active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      {children}
    </button>
  );
}
