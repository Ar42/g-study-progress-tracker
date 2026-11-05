import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface IconButtonProps extends Omit<ComponentProps<"button">, "children"> {
  /** Accessible name; also shown as the native tooltip. */
  readonly label: string;
  readonly icon: ReactNode;
  readonly tone?: "default" | "danger";
  readonly size?: "sm" | "md";
}

export function IconButton({
  label,
  icon,
  tone = "default",
  size = "md",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        "disabled:pointer-events-none disabled:opacity-40",
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-3 hover:text-fg",
        size === "sm" ? "size-7 [&_svg]:size-3.5" : "size-9 [&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}
