import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export interface FieldProps {
  readonly label: string;
  readonly htmlFor?: string;
  readonly required?: boolean;
  readonly hint?: string;
  readonly error?: string;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Label + control + hint/error, with consistent spacing. */
export function Field({ label, htmlFor, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-fg-muted">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
}
