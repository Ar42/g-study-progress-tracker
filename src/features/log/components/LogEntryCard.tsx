import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, Pencil, Trash2 } from "lucide-react";
import { Badge, IconButton, Markdown } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import type { LogEntry } from "../../../types";
import { formatMinutes, type EntryNames } from "../logStats";

const LONG = 420; // characters before the note is collapsed

export interface LogEntryCardProps {
  readonly entry: LogEntry;
  readonly names: EntryNames & { exists: boolean };
  readonly onEdit: (entry: LogEntry) => void;
  readonly onDelete: (entry: LogEntry) => void;
}

/** Memoised: re-renders only when its own entry/names change, not on every keystroke in search. */
export const LogEntryCard = memo(function LogEntryCard({ entry, names, onEdit, onDelete }: LogEntryCardProps) {
  const long = entry.description.length > LONG || entry.description.split("\n").length > 10;
  const [expanded, setExpanded] = useState(false);
  const href = entry.category === "IT" ? "/it" : `/subject/${encodeURIComponent(entry.subjectId)}`;

  return (
    <article className="group rounded-xl border border-border bg-surface p-4 shadow-card">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone={entry.category === "IT" ? "primary" : "neutral"}>{entry.category}</Badge>
          <p className="flex min-w-0 flex-wrap items-center gap-1 text-sm">
            {entry.category === "BCS" && (
              <>
                <Link to={href} className="text-fg-muted hover:text-primary hover:underline">
                  {names.subject}
                </Link>
                <ChevronRight className="size-3.5 text-fg-subtle" />
              </>
            )}
            <span className={cn("font-semibold text-fg", !names.exists && "text-fg-muted")} title={names.exists ? undefined : "This topic no longer exists"}>
              {names.topic}
            </span>
          </p>
          {entry.minutes !== null && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-fg-subtle">
              <Clock className="size-3.5" />
              {formatMinutes(entry.minutes)}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:focus-within:opacity-100">
          <IconButton label="Edit entry" icon={<Pencil />} size="sm" onClick={() => onEdit(entry)} />
          <IconButton label="Delete entry" icon={<Trash2 />} size="sm" tone="danger" onClick={() => onDelete(entry)} />
        </div>
      </header>

      <div className={cn("relative mt-3", long && !expanded && "max-h-44 overflow-hidden")}>
        <Markdown source={entry.description} />
        {long && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent" />
        )}
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 cursor-pointer text-xs font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </article>
  );
});
