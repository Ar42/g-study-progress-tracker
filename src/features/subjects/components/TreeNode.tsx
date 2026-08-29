import { useState } from "react";
import {
  Folder,
  FolderOpen,
  BookOpen,
  ChevronRight,
  ChevronDown,
  // Edit2,
  ExternalLink,
} from "lucide-react";
import type { StudyNode } from "../../../types";
import { ProgressStatus } from "../../../enums/progress";
import { calculateProgress } from "../../../utils/progress";
import { clsx } from "clsx";

interface TreeNodeProps {
  readonly node: StudyNode;
  readonly subjectId: string;
  readonly depth?: number;
  readonly onEdit?: (node: any, subjectId: string) => void;
  readonly filterStatus?: string;
  readonly onStatusToggle?: (node: any, newStatus: ProgressStatus) => void;
  readonly onNodeMove?: (draggedId: string, targetId: string) => void;
  readonly index?: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  subjectId,
  index,
  depth = 0,
  onEdit,
  filterStatus = "ALL",
  onStatusToggle,
  onNodeMove,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const isParent = "children" in node;
  const stats = isParent ? calculateProgress(node) : null;

  // Filtering Logic
  // If it's a leaf node and doesn't match filter, hide it
  if (
    !isParent &&
    filterStatus !== "ALL" &&
    (node as any).status !== filterStatus
  ) {
    return null;
  }

  // If it's a parent, we only want to hide it if ALL its leaf descendants are filtered out.
  // For simplicity, we just let it render, but its children might be empty.
  // A better approach is to compute if it has visible children, but we'll stick to a simple filter.

  const toggleExpand = () => {
    if (isParent) {
      setIsExpanded(!isExpanded);
    }
  };

  const getTextColor = () => {
    if (isParent) {
      if (!stats) return "text-text-primary";
      if (stats.percentage === 100) return "text-status-completed";
      if (stats.percentage > 0) return "text-status-progress";
      return "text-status-notstarted";
    } else {
      const status = (node as any).status;
      if (status === ProgressStatus.COMPLETED) return "text-status-completed";
      if (status === ProgressStatus.IN_PROGRESS) return "text-status-progress";
      if (status === ProgressStatus.OVERDUE) return "text-red-500";
      return "text-status-notstarted";
    }
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(node, subjectId);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData("text/plain");
    if (draggedId && draggedId !== node.id && onNodeMove) {
      onNodeMove(draggedId, node.id);
    }
  };

  return (
    <div className="w-full">
      {/* Node Row */}
      <div
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          "flex items-center justify-between py-2.5 px-4 my-1.5 rounded-lg border transition-all duration-200 group cursor-grab active:cursor-grabbing",
          isParent
            ? "bg-bg-surface/30 border-border-subtle hover:bg-bg-surface/50"
            : "bg-bg-surface/10 border-transparent hover:bg-bg-surface/20",
          isDragOver && "border-primary bg-primary/10 scale-[1.01]",
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Collapse/Expand toggle for parent */}
            {isParent ? (
              <button
                onClick={toggleExpand}
                className="p-1 rounded hover:bg-bg-surface-hover text-text-secondary hover:text-text-primary transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}

            {/* File/Folder Icon */}
            <span className="text-text-muted flex-shrink-0 hidden sm:block">
              {isParent ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 text-primary" />
                )
              ) : (
                <BookOpen className="h-4 w-4 text-text-muted" />
              )}
            </span>

            {/* Node Name */}
            <div className="flex items-center gap-2 break-words whitespace-normal flex-1">
              {/* <span className="bg-black text-white text-xs p-1 rounded-md"> */}
              {index !== undefined && (
                <span className="text-sm p-1 rounded-md font-bold">
                  {index + 1}{" "}
                </span>
              )}
              <span
                onClick={handleTextClick}
                className={clsx(
                  "break-words whitespace-normal text-sm select-none hover:underline cursor-pointer",
                  isParent ? "font-medium" : "",
                  getTextColor(),
                )}
              >
                {node.name}
              </span>
              {node.preliMarks && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 flex-shrink-0 font-numbers">
                  Preli: {node.preliMarks}
                </span>
              )}
            </div>
          </div>
          {node.comments && (
            <div className="text-xs text-text-muted mt-1 ml-[34px] italic break-words whitespace-normal opacity-80">
              {node.comments}
            </div>
          )}
          {((node as any).startedDate ||
            (node as any).targetToCompleteDate ||
            (node as any).completedDate) && (
            <div className="flex flex-wrap gap-3 mt-1.5 ml-[34px] text-[10px] font-medium">
              {(node as any).startedDate && (
                <span className="text-text-muted">
                  Started: {(node as any).startedDate}
                </span>
              )}
              {(node as any).targetToCompleteDate && (
                <span className="text-yellow-500">
                  Target: {(node as any).targetToCompleteDate}
                </span>
              )}
              {(node as any).completedDate && (
                <span className="text-status-completed">
                  Completed: {(node as any).completedDate}
                </span>
              )}
            </div>
          )}
          {node.links && node.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2 ml-[34px]">
              {node.links.map((link, idx) => (
                <a
                  key={idx}
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors max-w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{link.title || link.link}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Completion Info & Actions */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {isParent && stats && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-text-muted font-numbers">
                {stats.completed} / {stats.total}
              </span>
              <span
                className={clsx(
                  "text-xs px-2.5 py-0.5 rounded-full font-medium border transition-colors font-numbers",
                  stats.percentage === 100
                    ? "bg-status-completed-bg text-status-completed border-status-completed/30"
                    : stats.percentage > 0
                      ? "bg-status-progress-bg text-status-progress border-status-progress/30"
                      : "bg-status-notstarted-bg text-status-notstarted border-status-notstarted/30",
                )}
              >
                {stats.percentage}%
              </span>
            </div>
          )}

          {!isParent && onStatusToggle && (
            <div className="flex items-center gap-2">
              {/* In Progress Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentStatus = (node as any).status;
                  const newStatus =
                    currentStatus === ProgressStatus.IN_PROGRESS ||
                    currentStatus === ProgressStatus.OVERDUE
                      ? ProgressStatus.NOT_STARTED
                      : ProgressStatus.IN_PROGRESS;
                  onStatusToggle(node, newStatus);
                }}
                className={clsx(
                  "px-2 py-1 text-xs font-semibold rounded transition-all duration-200 cursor-pointer",
                  (node as any).status === ProgressStatus.IN_PROGRESS ||
                    (node as any).status === ProgressStatus.OVERDUE
                    ? "bg-yellow-500 text-black border-2 border-yellow-300 shadow-md shadow-yellow-500/20 font-bold"
                    : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/25",
                )}
                title="Mark as In Progress"
              >
                In Progress
              </button>

              {/* Completed Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentStatus = (node as any).status;
                  const newStatus =
                    currentStatus === ProgressStatus.COMPLETED
                      ? ProgressStatus.NOT_STARTED
                      : ProgressStatus.COMPLETED;
                  onStatusToggle(node, newStatus);
                }}
                className={clsx(
                  "px-2 py-1 text-xs font-semibold rounded transition-all duration-200 cursor-pointer",
                  (node as any).status === ProgressStatus.COMPLETED
                    ? "bg-emerald-500 text-black border-2 border-emerald-300 shadow-md shadow-emerald-500/20 font-bold"
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25",
                )}
                title="Mark as Done"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Children Nodes */}
      {isParent && isExpanded && (
        <div className="w-full relative">
          {node.children.length > 0 && (
            <div
              className="absolute left-[20px] top-0 bottom-2.5 w-[1px] bg-border-subtle"
              style={{ marginLeft: `${depth * 16}px` }}
            />
          )}

          <div className="flex flex-col">
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                subjectId={subjectId}
                depth={depth + 1}
                onEdit={onEdit}
                filterStatus={filterStatus}
                onStatusToggle={onStatusToggle}
                onNodeMove={onNodeMove}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
TreeNode.displayName = "TreeNode";
