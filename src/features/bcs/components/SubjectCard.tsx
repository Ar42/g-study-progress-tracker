import type { DragEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../../lib/cn";
import { StatusBar } from "../../../components/ui";
import type { Subject } from "../../../types";
import { collectLeaves, countByStatus } from "../../../lib/tree";
import { statusSegments } from "../../study/statusSegments";

export interface SubjectCardProps {
  readonly subject: Subject;
  readonly dragging?: boolean;
  readonly dropTarget?: boolean;
  readonly dragHandlers?: {
    onDragStart: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
    onDragEnd: () => void;
  };
}

/** A real <Link>, so click / Ctrl+click / middle-click / "open in new tab" all just work. */
export function SubjectCard({ subject, dragging, dropTarget, dragHandlers }: SubjectCardProps) {
  const { row, stats } = subject;
  const counts = countByStatus(collectLeaves(subject.children).map((l) => l.status));
  const done = stats.percentage === 100 && stats.total > 0;
  const empty = stats.total === 0;

  return (
    <Link
      to={`/subject/${encodeURIComponent(row.id)}`}
      draggable={Boolean(dragHandlers)}
      {...dragHandlers}
      onClick={(e: MouseEvent) => dragging && e.preventDefault()}
      className={cn(
        "group relative flex h-full flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-card transition-all",
        "hover:-translate-y-0.5 hover:border-border-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25",
        dragging && "opacity-40",
        dropTarget && "border-primary ring-4 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold leading-snug text-fg wrap-break-word">{row.name}</h3>
          <p className="mt-1 text-xs text-fg-subtle">
            {subject.marks > 0 ? `${subject.marks} marks` : "Marks not set"}
            {!empty && ` · ${stats.total} chapters`}
          </p>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-fg-subtle transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      {empty ? (
        <p className="text-sm text-fg-subtle italic">No chapters added yet</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className={cn("font-numbers text-4xl leading-none", done ? "text-success" : "text-fg")}>
              {stats.percentage}
              <span className="text-lg text-fg-subtle">%</span>
            </span>
            <span className="text-xs text-fg-muted">
              <span className="font-numbers text-fg">{stats.completed}</span> / {stats.total} done
            </span>
          </div>
          <StatusBar segments={statusSegments(counts)} />
          {(counts.OVERDUE > 0 || counts.IN_PROGRESS > 0) && (
            <div className="flex gap-3 text-xs font-medium">
              {counts.IN_PROGRESS > 0 && <span className="text-info">{counts.IN_PROGRESS} reading</span>}
              {counts.OVERDUE > 0 && <span className="text-danger">{counts.OVERDUE} overdue</span>}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
