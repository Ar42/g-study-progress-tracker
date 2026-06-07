import { useState } from "react";
import { Folder, FolderOpen, BookOpen, ChevronRight, ChevronDown } from "lucide-react";
import type { StudyNode } from "../../../types";
import { ProgressStatus } from "../../../enums/progress";
import { calculateProgress } from "../../../utils/progress";
import { useStudyStore } from "../../../stores/useStudyStore";
import { clsx } from "clsx";

interface TreeNodeProps {
  readonly node: StudyNode;
  readonly subjectId: string;
  readonly depth?: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({ node, subjectId, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const updateLeafStatus = useStudyStore((state) => state.updateLeafStatus);

  const isParent = "children" in node;

  const stats = isParent ? calculateProgress(node) : null;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateLeafStatus(subjectId, node.id, e.target.value as ProgressStatus);
  };

  const toggleExpand = () => {
    if (isParent) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="w-full">
      {/* Node Row */}
      <div
        className={clsx(
          "flex items-center justify-between py-2.5 px-4 my-1.5 rounded-lg border transition-all duration-200",
          isParent
            ? "bg-bg-surface/30 border-border-subtle hover:bg-bg-surface/50"
            : "bg-bg-surface/10 border-transparent hover:bg-bg-surface/20"
        )}
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
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
          <span className="text-text-muted flex-shrink-0">
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
          <span
            onClick={toggleExpand}
            className={clsx(
              "truncate text-sm select-none",
              isParent ? "font-medium text-text-primary cursor-pointer" : "text-text-secondary"
            )}
          >
            {node.name}
          </span>
        </div>

        {/* Completion Info */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {isParent && stats && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-text-muted">
                {stats.completed} / {stats.total}
              </span>
              <span
                className={clsx(
                  "text-xs px-2.5 py-0.5 rounded-full font-medium border transition-colors",
                  stats.percentage === 100
                    ? "bg-status-completed-bg text-status-completed border-status-completed/30"
                    : stats.percentage > 0
                    ? "bg-status-progress-bg text-status-progress border-status-progress/30"
                    : "bg-status-notstarted-bg text-status-notstarted border-status-notstarted/30"
                )}
              >
                {stats.percentage}%
              </span>
            </div>
          )}

          {!isParent && (
            <div className="relative">
              <select
                value={(node as any).status}
                onChange={handleStatusChange}
                className={clsx(
                  "text-xs font-semibold px-2 py-1 rounded-md border bg-bg-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-all duration-200",
                  (node as any).status === ProgressStatus.COMPLETED &&
                    "text-status-completed border-status-completed/40 bg-status-completed-bg hover:bg-status-completed-bg/15",
                  (node as any).status === ProgressStatus.IN_PROGRESS &&
                    "text-status-progress border-status-progress/40 bg-status-progress-bg hover:bg-status-progress-bg/15",
                  (node as any).status === ProgressStatus.NOT_STARTED &&
                    "text-status-notstarted border-status-notstarted/40 bg-status-notstarted-bg hover:bg-status-notstarted-bg/15"
                )}
              >
                <option value={ProgressStatus.NOT_STARTED} className="bg-bg-base text-text-secondary">
                  Not Started
                </option>
                <option value={ProgressStatus.IN_PROGRESS} className="bg-bg-base text-status-progress">
                  In Progress
                </option>
                <option value={ProgressStatus.COMPLETED} className="bg-bg-base text-status-completed">
                  Completed
                </option>
              </select>
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
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
TreeNode.displayName = "TreeNode";
