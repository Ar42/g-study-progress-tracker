import { AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "../lib/cn";
import { IconButton, Spinner } from "../components/ui";
import { useSyncStatus } from "../services/syncStatus";

export interface SyncIndicatorProps {
  readonly fetching: boolean;
  readonly onSync: () => void;
}

/** Shows whether edits are saved to the sheet, plus a manual refresh button. */
export function SyncIndicator({ fetching, onSync }: SyncIndicatorProps) {
  const { pending, lastError, lastSyncedAt } = useSyncStatus();
  const [, tick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => tick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Warn before closing the tab with unsaved writes.
  useEffect(() => {
    if (pending === 0) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pending]);

  let content;
  if (pending > 0) {
    content = (
      <>
        <Spinner className="size-3.5 text-primary" />
        <span>Saving{pending > 1 ? ` ${pending}` : ""}…</span>
      </>
    );
  } else if (lastError) {
    content = (
      <>
        <AlertCircle className="size-3.5 text-danger" />
        <span className="text-danger">Last save failed</span>
      </>
    );
  } else {
    content = (
      <>
        <CheckCircle2 className="size-3.5 text-success" />
        <span>
          {lastSyncedAt ? `Synced ${formatDistanceToNowStrict(lastSyncedAt, { addSuffix: true })}` : "Synced"}
        </span>
      </>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className="hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-subtle sm:flex"
        aria-live="polite"
        title={lastError ?? undefined}
      >
        {content}
      </div>
      <IconButton
        label="Refresh from Google Sheet"
        icon={<RefreshCw className={cn(fetching && "animate-spin")} />}
        onClick={onSync}
        disabled={fetching || pending > 0}
      />
    </div>
  );
}
