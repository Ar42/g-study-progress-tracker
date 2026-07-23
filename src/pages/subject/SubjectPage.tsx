import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateProgress } from "../../utils/progress";
import { TreeNode } from "../../features/subjects/components/TreeNode";
import { Card } from "../../components/ui/Card";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import { ChapterFormModal } from "./ChapterFormModal";
import { useExecuteAdminActionMutation } from "../../services/adminApi";
import { useLazyFetchStudyDataQuery } from "../../services/sheetApi";
import { toast } from "sonner";
import { ProgressStatus } from "../../enums/progress";
import {
  ChevronLeft,
  BookOpen,
  AlertTriangle,
  Plus,
  Filter,
} from "lucide-react";
import type { StudyNode } from "../../types";

export const SubjectPage: React.FC = () => {
  const { subjectId } = useParams<{ readonly subjectId: string }>();
  const subjects = useStudyStore((state) => state.subjects);
  const setSubjects = useStudyStore((state) => state.setSubjects);

  const [executeAdminAction, { isLoading }] = useExecuteAdminActionMutation();
  const [triggerFetch] = useLazyFetchStudyDataQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const subject = subjects.find((s) => s.id === subjectId);

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-status-progress" />
        <h2 className="text-xl font-bold">Subject Not Found</h2>
        <p className="text-text-secondary">
          The requested subject could not be located.
        </p>
        <Link
          to="/"
          className="text-primary hover:underline font-medium text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const stats = calculateProgress(subject);

  const handleCreateChapter = () => {
    setEditingNode(null);
    setIsModalOpen(true);
  };

  const handleEditChapter = (node: StudyNode) => {
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const handleStatusToggle = async (node: any, newStatus: ProgressStatus) => {
    const todayStr = new Date().toISOString().split("T")[0];
    let startedDate = node.startedDate || "";
    let completedDate = node.completedDate || "";

    if (newStatus === ProgressStatus.COMPLETED) {
      completedDate = todayStr;
      if (!startedDate) startedDate = todayStr;
    } else if (newStatus === ProgressStatus.IN_PROGRESS) {
      completedDate = "";
      if (!startedDate) startedDate = todayStr;
    } else if (newStatus === ProgressStatus.NOT_STARTED) {
      completedDate = "";
      startedDate = "";
    }

    const payload = {
      id: node.id,
      name: node.name,
      is_subject: false,
      parentId: node.parentId || subject.id,
      status: newStatus,
      preliMarks: node.preliMarks ? String(node.preliMarks) : "",
      comments: node.comments || "",
      startedDate,
      targetToCompleteDate: node.targetToCompleteDate || "",
      completedDate,
      links: node.links || [],
    };

    try {
      await executeAdminAction({
        action: "UPDATE",
        payload,
      }).unwrap();

      toast.success(
        `Chapter status updated to ${newStatus.replace("_", " ").toLowerCase()}!`,
      );
      const data = await triggerFetch().unwrap();
      if (data) setSubjects(data);
    } catch {
      toast.error("Failed to update status on Google Sheet.");
    }
  };

  const handleNodeMove = async (draggedId: string, targetId: string) => {
    const findNode = (nodes: readonly StudyNode[]): StudyNode | null => {
      for (const n of nodes) {
        console.log("nodes: ", { draggedId, nodes });

        if (n.id === draggedId) return n;
        if ("children" in n && Array.isArray(n.children)) {
          const found = findNode(n.children);
          console.log("found: ", found);
          if (found) return found;
        }
      }
      return null;
    };

    const draggedNode = findNode(subject.children);
    if (!draggedNode) return;

    const findTarget = (nodes: readonly StudyNode[]): StudyNode | null => {
      for (const n of nodes) {
        if (n.id === targetId) return n;
        if ("children" in n && Array.isArray(n.children)) {
          const found = findTarget(n.children);
          if (found) return found;
        }
      }
      return null;
    };

    const targetNode = findTarget(subject.children);
    if (!targetNode) return;

    let newParentId = subject.id;
    const isTargetParent = "children" in targetNode;
    if (isTargetParent) {
      newParentId = targetNode.id;
    } else {
      newParentId = targetNode.parentId || subject.id;
    }

    const isDescendant = (parent: StudyNode, childId: string): boolean => {
      if (!("children" in parent)) return false;
      for (const c of parent.children) {
        if (c.id === childId) return true;
        if (isDescendant(c, childId)) return true;
      }
      return false;
    };

    if (
      draggedNode.id === newParentId ||
      isDescendant(draggedNode, newParentId)
    ) {
      toast.error("Cannot move a folder into itself or its own subfolders.");
      return;
    }

    const payload = {
      id: draggedNode.id,
      name: draggedNode.name,
      is_subject: false,
      parentId: newParentId,
      status: (draggedNode as any).status || ProgressStatus.NOT_STARTED,
      preliMarks: draggedNode.preliMarks ? String(draggedNode.preliMarks) : "",
      comments: draggedNode.comments || "",
      startedDate: draggedNode.startedDate || "",
      targetToCompleteDate: draggedNode.targetToCompleteDate || "",
      completedDate: draggedNode.completedDate || "",
      links: draggedNode.links || [],
    };

    try {
      await executeAdminAction({
        action: "UPDATE",
        payload,
      }).unwrap();

      toast.success(`Moved "${draggedNode.name}" successfully!`);
      const data = await triggerFetch().unwrap();
      if (data) setSubjects(data);
    } catch {
      toast.error("Failed to move chapter on Google Sheet.");
    }
  };

  const onSave = async (payload: any) => {
    const action = editingNode ? "UPDATE" : "CREATE";
    try {
      await executeAdminAction({
        action,
        payload,
      }).unwrap();

      toast.success(
        `Chapter ${action === "CREATE" ? "created" : "updated"} successfully!`,
      );
      setIsModalOpen(false);

      const data = await triggerFetch().unwrap();
      if (data) setSubjects(data);
    } catch (e) {
      toast.error(`Failed to ${action.toLowerCase()} chapter.`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary transition-colors mb-2 group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary break-words whitespace-normal">
            {subject.name}
          </h1>
          <p className="text-text-secondary text-sm">
            Recursive tree hierarchy breakdown and progress tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm text-text-primary focus:outline-none appearance-none pr-2"
            >
              <option value="ALL" className="bg-bg-surface text-text-primary">
                All Status
              </option>
              <option
                value={ProgressStatus.COMPLETED}
                className="bg-bg-surface text-text-primary"
              >
                Completed
              </option>
              <option
                value={ProgressStatus.IN_PROGRESS}
                className="bg-bg-surface text-text-primary"
              >
                In Progress
              </option>
              <option
                value={ProgressStatus.OVERDUE}
                className="bg-bg-surface text-text-primary"
              >
                Overdue
              </option>
              <option
                value={ProgressStatus.NOT_STARTED}
                className="bg-bg-surface text-text-primary"
              >
                Not Started
              </option>
            </select>
            {filterStatus !== "ALL" && (
              <button
                onClick={() => setFilterStatus("ALL")}
                className="text-text-muted hover:text-text-primary"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleCreateChapter}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-text-primary rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-text-primary">
              Progress Breakdown
            </h2>
            <div className="text-sm text-text-secondary mt-0.5">
              <span>{stats.completed}</span> completed out of{" "}
              <span>{stats.total}</span> leaf chapters.
            </div>
            {subject.preliMarks && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-status-progress border border-primary/20">
                  Preli Marks: {subject.preliMarks}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <span className="text-2xl font-black text-text-primary block">
              {stats.percentage}%
            </span>
            <span className="text-xs text-text-muted">Total Completion</span>
          </div>
          <ProgressCircle
            percentage={stats.percentage}
            size={85}
            strokeWidth={7}
          />
        </div>
      </Card>

      {/* Tree Card */}
      <Card className="p-4 sm:p-6">
        <h3 className="font-bold text-lg text-text-primary mb-6 border-b border-border-subtle pb-4">
          Chapter Hierarchy
        </h3>
        <div className="space-y-2 max-w-full overflow-x-auto">
          {subject.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              subjectId={subject.id}
              onEdit={handleEditChapter}
              filterStatus={filterStatus}
              onStatusToggle={handleStatusToggle}
              onNodeMove={handleNodeMove}
            />
          ))}
        </div>
      </Card>

      {isModalOpen && (
        <ChapterFormModal
          initialData={editingNode}
          parentId={subject.id}
          onClose={() => setIsModalOpen(false)}
          onSave={onSave}
          isSaving={isLoading}
        />
      )}
    </div>
  );
};
SubjectPage.displayName = "SubjectPage";
