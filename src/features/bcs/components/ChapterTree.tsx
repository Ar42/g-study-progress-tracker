import { useState, type DragEvent } from "react";
import { ChevronRight, GripVertical, Pencil, Play } from "lucide-react";
import { cn } from "../../../lib/cn";
import { Badge, IconButton, ProgressBar } from "../../../components/ui";
import type { StoredStatus } from "../../../enums/progress";
import type { TreeNode } from "../../../types";
import { ItemDetails } from "../../study/components/ItemDetails";
import { StatusControl } from "../../study/components/StatusControl";
import { StatusIcon, StatusTag } from "../../study/components/StatusVisual";
import { statusNameClass, statusRowClass } from "../../study/statusStyles";
import { collectLeaves, countByStatus } from "../../../lib/tree";

export interface ChapterTreeProps {
  readonly nodes: readonly TreeNode[];
  readonly onEdit: (node: TreeNode) => void;
  /** Start the study timer on a chapter. */
  readonly onStartTimer?: (node: TreeNode) => void;
  readonly onStatusChange: (node: TreeNode, status: StoredStatus) => void;
  /** Enables drag & drop re-parenting (desktop). */
  readonly onMove?: (draggedId: string, target: TreeNode) => void;
  readonly collapsed: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  /** Show 1., 2., … numbering on top-level rows. */
  readonly numbered?: boolean;
}

export function ChapterTree(props: ChapterTreeProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return (
    <ul className="space-y-1" role="tree">
      {props.nodes.map((node, i) => (
        <ChapterRow
          key={node.row.id}
          {...props}
          node={node}
          depth={0}
          index={props.numbered ? i + 1 : undefined}
          dnd={{ dragId, overId, setDragId, setOverId }}
        />
      ))}
    </ul>
  );
}

interface DndState {
  readonly dragId: string | null;
  readonly overId: string | null;
  readonly setDragId: (id: string | null) => void;
  readonly setOverId: (id: string | null) => void;
}

interface RowProps extends ChapterTreeProps {
  readonly node: TreeNode;
  readonly depth: number;
  readonly index?: number;
  readonly dnd: DndState;
}

function ChapterRow({ node, depth, index, dnd, ...tree }: RowProps) {
  const { onEdit, onStatusChange, onMove, onStartTimer, collapsed, onToggle } = tree;
  const { row, isLeaf, stats, status } = node;
  const open = !collapsed.has(row.id);
  const inside = isLeaf ? null : countByStatus(collectLeaves(node.children).map((l) => l.status));
  const draggable = Boolean(onMove);

  const dragHandlers = draggable
    ? {
        draggable: true,
        onDragStart: (e: DragEvent) => {
          e.stopPropagation();
          e.dataTransfer.setData("text/plain", row.id);
          e.dataTransfer.effectAllowed = "move";
          dnd.setDragId(row.id);
        },
        onDragEnd: () => {
          dnd.setDragId(null);
          dnd.setOverId(null);
        },
        onDragOver: (e: DragEvent) => {
          if (!dnd.dragId || dnd.dragId === row.id) return;
          e.preventDefault();
          e.stopPropagation();
          if (dnd.overId !== row.id) dnd.setOverId(row.id);
        },
        onDragLeave: (e: DragEvent) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null) && dnd.overId === row.id) {
            dnd.setOverId(null);
          }
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          const dragged = e.dataTransfer.getData("text/plain");
          dnd.setOverId(null);
          dnd.setDragId(null);
          if (dragged && dragged !== row.id) onMove?.(dragged, node);
        },
      }
    : {};

  return (
    <li role="treeitem" aria-expanded={isLeaf ? undefined : open}>
      <div
        {...dragHandlers}
        className={cn(
          "group relative flex flex-col gap-2 rounded-xl border px-2.5 py-2.5 transition-colors sm:flex-row sm:items-start sm:gap-3",
          isLeaf
            ? cn("border-transparent", statusRowClass(status), (status === "NOT_STARTED" || status === "COMPLETED") && "hover:bg-surface-2")
            : "border-border bg-surface-2/40 hover:bg-surface-2",
          dnd.overId === row.id && "border-primary/60 bg-primary-soft",
          dnd.dragId === row.id && "opacity-40",
        )}
        style={{ marginLeft: depth * 20 }}
      >
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          {draggable && (
            <GripVertical className="mt-1 hidden size-4 shrink-0 cursor-grab text-fg-subtle/0 transition-colors group-hover:text-fg-subtle lg:block" />
          )}
          {isLeaf ? (
            <span className="flex size-6 shrink-0 items-center justify-center">
              <StatusIcon status={status} />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onToggle(row.id)}
              aria-label={open ? "Collapse" : "Expand"}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-subtle hover:bg-surface-3 hover:text-fg"
            >
              <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} />
            </button>
          )}

          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <div className="flex items-start gap-2">
              {index !== undefined && (
                <span className="pt-0.5 font-numbers text-xs text-fg-subtle">{String(index).padStart(2, "0")}</span>
              )}
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onEdit(node)}
                  className={cn(
                    "cursor-pointer text-left text-sm wrap-break-word hover:underline hover:decoration-fg-subtle hover:underline-offset-4",
                    isLeaf ? statusNameClass(status) : "font-semibold text-fg",
                  )}
                >
                  {row.name}
                </button>
                <span className="ml-2 inline-flex flex-wrap items-center gap-1.5 align-middle">
                  {isLeaf && <StatusTag status={status} />}
                  {inside && inside.OVERDUE > 0 && (
                    <Badge tone="danger" dot>
                      {inside.OVERDUE} overdue
                    </Badge>
                  )}
                  {inside && inside.IN_PROGRESS > 0 && (
                    <Badge tone="info" dot>
                      {inside.IN_PROGRESS} in progress
                    </Badge>
                  )}
                  {row.preliMarks && (
                    <Badge tone="primary" className="font-numbers">
                      {row.preliMarks} marks
                    </Badge>
                  )}
                </span>
              </div>
            </div>
            <ItemDetails row={row} status={status} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pl-8 sm:pl-0">
          {isLeaf ? (
            <StatusControl status={status} onChange={(s) => onStatusChange(node, s)} />
          ) : (
            <div className="flex w-36 items-center gap-2" title={`${stats.completed} of ${stats.total} done`}>
              <ProgressBar value={stats.percentage} />
              <span className="w-14 shrink-0 text-right font-numbers text-xs text-fg-muted">
                {stats.completed}/{stats.total}
              </span>
            </div>
          )}
          {isLeaf && onStartTimer && (
            <IconButton
              label={`Start timer on ${row.name}`}
              icon={<Play />}
              size="sm"
              onClick={() => onStartTimer(node)}
              className="text-primary lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
            />
          )}
          <IconButton
            label={`Edit ${row.name}`}
            icon={<Pencil />}
            size="sm"
            onClick={() => onEdit(node)}
            className="lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          />
        </div>
      </div>

      {!isLeaf && open && node.children.length > 0 && (
        <ul className="mt-1 space-y-1" role="group">
          {node.children.map((child) => (
            <ChapterRow key={child.row.id} {...tree} node={child} depth={depth + 1} dnd={dnd} />
          ))}
        </ul>
      )}
    </li>
  );
}
