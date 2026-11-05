import { GripVertical, Pencil } from "lucide-react";
import { cn } from "../../../lib/cn";
import { IconButton } from "../../../components/ui";
import type { StoredStatus } from "../../../enums/progress";
import type { Topic } from "../../../types";
import { ItemDetails } from "../../study/components/ItemDetails";
import { StatusControl } from "../../study/components/StatusControl";
import { StatusIcon, StatusTag } from "../../study/components/StatusVisual";
import { statusNameClass, statusRowClass } from "../../study/statusStyles";
import { useDragSwap } from "../../study/hooks/useDragSwap";

export interface TopicListProps {
  readonly topics: readonly Topic[];
  /** Position of each topic in the full (unfiltered) list, for stable numbering. */
  readonly numberOf: (id: string) => number;
  readonly onEdit: (topic: Topic) => void;
  readonly onStatusChange: (topic: Topic, status: StoredStatus) => void;
  /** Enables drag-to-reorder. Pass undefined while filtering. */
  readonly onSwap?: (a: string, b: string) => void;
}

export function TopicList({ topics, numberOf, onEdit, onStatusChange, onSwap }: TopicListProps) {
  const dnd = useDragSwap((a, b) => onSwap?.(a, b));
  const draggable = Boolean(onSwap);

  return (
    <ul className="divide-y divide-border">
      {topics.map((t) => {
        const { row, status } = t;
        return (
          <li
            key={row.id}
            draggable={draggable}
            onDragStart={draggable ? (e) => dnd.start(e, row.id) : undefined}
            onDragOver={draggable ? (e) => dnd.over(e, row.id) : undefined}
            onDragLeave={draggable ? (e) => dnd.leave(e, row.id) : undefined}
            onDrop={draggable ? (e) => dnd.drop(e, row.id) : undefined}
            onDragEnd={draggable ? dnd.end : undefined}
            className={cn(
              "group relative flex flex-col gap-3 px-4 py-3 transition-colors sm:flex-row sm:items-start sm:px-5",
              statusRowClass(status),
              (status === "NOT_STARTED" || status === "COMPLETED") && "hover:bg-surface-2/60",
              dnd.dragId === row.id && "opacity-40",
              dnd.overId === row.id && "bg-primary-soft",
            )}
          >
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex items-center gap-1 pt-0.5">
                {draggable && (
                  <GripVertical className="hidden size-4 cursor-grab text-fg-subtle/0 group-hover:text-fg-subtle lg:block" />
                )}
                <span className="w-6 font-numbers text-xs text-fg-subtle">
                  {String(numberOf(row.id)).padStart(2, "0")}
                </span>
                <StatusIcon status={status} />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className={cn(
                    "cursor-pointer text-left text-sm font-medium wrap-break-word hover:underline hover:decoration-fg-subtle hover:underline-offset-4",
                    statusNameClass(status),
                  )}
                >
                  {row.name}
                </button>
                <span className="ml-2 inline-flex align-middle">
                  <StatusTag status={status} />
                </span>
                <ItemDetails row={row} status={status} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <StatusControl status={status} onChange={(s) => onStatusChange(t, s)} />
              <IconButton
                label={`Edit ${row.name}`}
                icon={<Pencil />}
                size="sm"
                onClick={() => onEdit(t)}
                className="lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
