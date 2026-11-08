import { Check, Pause, Pencil, Play, Trash2 } from "lucide-react";
import { Button, IconButton } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { formatClock, formatMinutes } from "../../../lib/duration";
import { elapsedMs } from "../../../lib/sessionTime";
import { useSettings } from "../../targets/hooks/useSettings";
import { useActiveSession } from "../hooks/useActiveSession";
import { useNow } from "../hooks/useNow";
import { useTimerUi } from "../timerUi";

/** Live clock + pause/resume/finish for the active session. `size` picks dock vs card layout. */
export function SessionControls({ size = "compact" }: { readonly size?: "compact" | "large" }) {
  const { session, running, pause, resume } = useActiveSession();
  const { settings } = useSettings();
  const open = useTimerUi((s) => s.open);
  const now = useNow(running);

  if (!session) return null;
  const elapsed = elapsedMs(session.segments, now);
  const overLimit = running && elapsed / 60000 > settings.confirmSessionOverMinutes;
  const large = size === "large";

  return (
    <div className={cn("flex flex-col gap-3", large && "gap-5")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span
              className={cn(
                "size-2 rounded-full",
                running ? (overLimit ? "bg-warning" : "bg-success animate-pulse") : "bg-fg-subtle",
              )}
            />
            <span className={running ? (overLimit ? "text-warning" : "text-success") : "text-fg-subtle"}>
              {running ? (overLimit ? "Still studying?" : "Studying") : "Paused"}
            </span>
          </p>
          <p className={cn("mt-1 truncate font-semibold text-fg", large ? "text-lg" : "text-sm")} title={session.topicName}>
            {session.topicName || "Untitled topic"}
          </p>
          <p className="truncate text-xs text-fg-subtle">{session.category === "IT" ? "IT" : session.subjectName}</p>
        </div>
        <div className="flex shrink-0 items-center">
          <IconButton label="Edit session" icon={<Pencil />} size="sm" onClick={() => open({ kind: "edit" })} />
          <IconButton label="Discard session" icon={<Trash2 />} size="sm" tone="danger" onClick={() => open({ kind: "busy" })} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p
          className={cn("font-numbers leading-none tabular-nums", large ? "text-5xl" : "text-3xl", running ? "text-fg" : "text-fg-muted")}
          aria-live="off"
        >
          {formatClock(elapsed)}
        </p>
        <div className="flex items-center gap-2">
          {running ? (
            <Button variant="secondary" size="sm" icon={<Pause className="size-3.5" />} onClick={() => void pause()}>
              Pause
            </Button>
          ) : (
            <Button variant="secondary" size="sm" icon={<Play className="size-3.5" />} onClick={() => void resume()}>
              Resume
            </Button>
          )}
          <Button size="sm" icon={<Check className="size-3.5" />} onClick={() => open({ kind: "finish" })}>
            Finish
          </Button>
        </div>
      </div>

      {overLimit && (
        <p className="text-xs text-warning">
          Running for over {formatMinutes(settings.confirmSessionOverMinutes)}. Pause if you've stopped — you can correct the time when you finish.
        </p>
      )}
    </div>
  );
}
