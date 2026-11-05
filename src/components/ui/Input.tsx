import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { controlClass } from "./styles";

export interface InputProps extends ComponentProps<"input"> {
  /** Optional leading icon rendered inside the field. */
  readonly leading?: ReactNode;
}

export function Input({ className, leading, ...props }: InputProps) {
  if (!leading) {
    return <input className={cn(controlClass, "h-10", className)} {...props} />;
  }
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-subtle [&_svg]:size-4">
        {leading}
      </span>
      <input className={cn(controlClass, "h-10 pl-9", className)} {...props} />
    </div>
  );
}

export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={rows} className={cn(controlClass, "resize-y py-2.5 leading-relaxed", className)} {...props} />;
}

export function DateInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return <input type="date" className={cn(controlClass, "h-10 font-medium tabular-nums", className)} {...props} />;
}
