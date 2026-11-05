import type { DragEvent, MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../../lib/cn";
import { ProgressBar } from "../../../components/ui";
import type { Subject } from "../../../types";
import { collectLeaves, countByStatus } from "../../../lib/tree";

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

  return (
    <Link
      to={`/subject/${encodeURIComponent(row.id)}`}
      draggable={Boolean(dragHandlers)}
      {...dragHandlers}
      onClick={(e: MouseEvent) => dragging && e.preventDefault()}
      className={cn(
        "group flex h-full flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-all",
        "hover:border-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
        dragging && "opacity-40",
        dropTarget && "border-primary/60 ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium leading-snug text-fg wrap-break-word">{row.name}</h3>
          <p className="mt-1 text-xs text-fg-subtle">
            {stats.total === 0 ? "No chapters yet" : `${stats.completed} of ${stats.total} chapters`}
            {subject.marks > 0 && <> · <span className="font-numbers">{subject.marks}</span> marks</>}
          </p>
        </div>
        <ArrowUpRight className="size-4 shrink-0 text-fg-subtle transition-colors group-hover:text-primary" />
      </div>

      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className={cn("font-numbers text-2xl", done ? "text-success" : "text-fg")}>{stats.percentage}%</span>
          <div className="flex gap-2 text-[11px] font-medium">
            {counts.OVERDUE > 0 && <span className="text-danger">{counts.OVERDUE} overdue</span>}
            {counts.IN_PROGRESS > 0 && <span className="text-warning">{counts.IN_PROGRESS} active</span>}
          </div>
        </div>
        <ProgressBar value={stats.percentage} />
      </div>
    </Link>
  );
}
