import { CalendarCheck, CalendarClock, CalendarPlus, ExternalLink, MessageSquareText } from "lucide-react";
import { cn } from "../../../lib/cn";
import { daysUntil, formatDisplayDate } from "../../../lib/date";
import { ProgressStatus, type DisplayStatus } from "../../../enums/progress";
import type { StudyRow } from "../../../types";

function targetHint(row: StudyRow, status: DisplayStatus): { text: string; className: string } | null {
  if (!row.targetDate || status === ProgressStatus.COMPLETED) return null;
  const d = daysUntil(row.targetDate);
  if (d === null) return null;
  if (d < 0) return { text: `${-d}d late`, className: "text-danger" };
  if (d === 0) return { text: "due today", className: "text-warning" };
  if (d <= 3) return { text: `in ${d}d`, className: "text-warning" };
  return { text: `in ${d}d`, className: "text-fg-subtle" };
}

/** Dates, comment and links shown under a chapter/topic name. Renders nothing when empty. */
export function ItemDetails({ row, status, className }: { readonly row: StudyRow; readonly status: DisplayStatus; readonly className?: string }) {
  const hint = targetHint(row, status);
  const hasDates = row.startedDate || row.targetDate || row.completedDate;
  const hasContent = hasDates || row.comments || row.links.length > 0;
  if (!hasContent) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {hasDates && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-subtle">
          {row.startedDate && (
            <span className="inline-flex items-center gap-1" title="Started">
              <CalendarPlus className="size-3.5" />
              {formatDisplayDate(row.startedDate)}
            </span>
          )}
          {row.targetDate && (
            <span className="inline-flex items-center gap-1" title="Target">
              <CalendarClock className="size-3.5" />
              {formatDisplayDate(row.targetDate)}
              {hint && <span className={cn("font-medium", hint.className)}>· {hint.text}</span>}
            </span>
          )}
          {row.completedDate && (
            <span className="inline-flex items-center gap-1 text-success/90" title="Completed">
              <CalendarCheck className="size-3.5" />
              {formatDisplayDate(row.completedDate)}
            </span>
          )}
        </div>
      )}

      {row.comments && (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-fg-muted">
          <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" />
          <span className="whitespace-pre-line wrap-break-word">{row.comments}</span>
        </p>
      )}

      {row.links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {row.links.map((l, i) => (
            <a
              key={`${l.link}-${i}`}
              href={l.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-0.5 text-xs text-fg-muted transition-colors hover:border-primary/40 hover:text-primary"
            >
              <ExternalLink className="size-3 shrink-0" />
              <span className="truncate">{l.title || l.sourceName || l.link}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
