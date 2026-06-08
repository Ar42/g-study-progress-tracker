import { useState } from "react";
import {
  Folder,
  FolderOpen,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Edit2,
  ExternalLink
} from "lucide-react";
import type { StudyNode } from "../../../types";
import { ProgressStatus } from "../../../enums/progress";
import { calculateProgress } from "../../../utils/progress";
import { clsx } from "clsx";

interface TreeNodeProps {
  readonly node: StudyNode;
  readonly subjectId: string;
  readonly depth?: number;
  readonly onEdit?: (node: any) => void;
  readonly filterStatus?: string;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  subjectId,
  depth = 0,
  onEdit,
  filterStatus = "ALL",
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isParent = "children" in node;
  const stats = isParent ? calculateProgress(node) : null;

  // Filtering Logic
  // If it's a leaf node and doesn't match filter, hide it
  if (!isParent && filterStatus !== "ALL" && (node as any).status !== filterStatus) {
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
      return "text-status-notstarted";
    }
  };

  const handleTextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(node);
    }
  };

  return (
    <div className="w-full">
      {/* Node Row */}
      <div
        className={clsx(
          "flex items-center justify-between py-2.5 px-4 my-1.5 rounded-lg border transition-all duration-200 group",
          isParent
            ? "bg-bg-surface/30 border-border-subtle hover:bg-bg-surface/50"
            : "bg-bg-surface/10 border-transparent hover:bg-bg-surface/20",
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
              <span
                onClick={handleTextClick}
                className={clsx(
                  "break-words whitespace-normal text-sm select-none hover:underline cursor-pointer",
                  isParent ? "font-medium" : "",
                  getTextColor()
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
TreeNode.displayName = "TreeNode";
