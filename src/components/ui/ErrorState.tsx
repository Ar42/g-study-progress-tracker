import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "./Button";

export interface ErrorStateProps {
  readonly title: string;
  /** The underlying reason (shown so you know what went wrong). */
  readonly message?: string | null;
  readonly onRetry?: () => void;
  readonly retrying?: boolean;
  readonly className?: string;
  /** Smaller, inline variant for use inside cards. */
  readonly compact?: boolean;
}

/** "Couldn't load …" with the reason and a Try again button. */
export function ErrorState({ title, message, onRetry, retrying, className, compact }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <div className={cn("flex items-center justify-center rounded-2xl bg-danger-soft text-danger", compact ? "size-9" : "size-11")}>
        <AlertTriangle className={compact ? "size-4" : "size-5"} />
      </div>
      <div className="space-y-1">
        <p className={cn("font-semibold text-fg", compact ? "text-sm" : "text-base")}>{title}</p>
        {message && <p className="mx-auto max-w-md text-sm break-words text-fg-subtle">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={<RefreshCw className="size-3.5" />} onClick={onRetry} loading={retrying}>
          Try again
        </Button>
      )}
    </div>
  );
}
