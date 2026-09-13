import React, { useState, useMemo } from "react";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateITProgress, getITStatusBreakdown } from "../../utils/progress";
import { Card } from "../../components/ui/Card";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import { ITTopicFormModal } from "./ITTopicFormModal";
import { useExecuteAdminActionMutation } from "../../services/adminApi";
import { useLazyFetchITStudyDataQuery } from "../../services/sheetApi";
import { toast } from "sonner";
import { ProgressStatus } from "../../enums/progress";
import {
  Code,
  Plus,
  Filter,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle,
  Timer,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";
import type { ITTopic } from "../../types";
import { clsx } from "clsx";

export const ITPage: React.FC = () => {
  const itTopics = useStudyStore((state) => state.itTopics);
  const setITTopics = useStudyStore((state) => state.setITTopics);

  const [executeAdminAction, { isLoading: isMutating }] =
    useExecuteAdminActionMutation();
  const [triggerFetchITData] = useLazyFetchITStudyDataQuery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<ITTopic | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    topic: ITTopic | null;
  }>({ isOpen: false, topic: null });

  // Drag and Drop State
  const [draggedTopicId, setDraggedTopicId] = useState<string | null>(null);
  const [dragOverTopicId, setDragOverTopicId] = useState<string | null>(null);

  const stats = useMemo(() => calculateITProgress(itTopics), [itTopics]);
  const breakdown = useMemo(() => getITStatusBreakdown(itTopics), [itTopics]);

  const filteredTopics = useMemo(() => {
    return itTopics.filter((topic) => {
      const matchesFilter =
        filterStatus === "ALL" || topic.status === filterStatus;
      const matchesSearch =
        !searchQuery.trim() ||
        topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (topic.comments &&
          topic.comments.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [itTopics, filterStatus, searchQuery]);

  const handleCreate = () => {
    setEditingTopic(null);
    setIsModalOpen(true);
  };

  const handleEdit = (topic: ITTopic) => {
    setEditingTopic(topic);
    setIsModalOpen(true);
  };

  const handleSave = async (payload: any) => {
    const action = editingTopic ? "UPDATE" : "CREATE";
    try {
      await executeAdminAction({
        action,
        domain: "IT",
        sheetName: "IT",
        payload: {
          ...payload,
          domain: "IT",
          sheetName: "IT",
        },
      }).unwrap();

      toast.success(
        `IT Topic ${action === "CREATE" ? "created" : "updated"} successfully!`,
      );
      setIsModalOpen(false);

      const data = await triggerFetchITData().unwrap();
      if (data) setITTopics(data);
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${action.toLowerCase()} IT topic.`);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.topic) return;
    const topic = deleteConfirm.topic;
    try {
      await executeAdminAction({
        action: "DELETE",
        domain: "IT",
        sheetName: "IT",
        payload: {
          id: topic.id,
          domain: "IT",
          sheetName: "IT",
        },
      }).unwrap();

      toast.success(`Deleted topic "${topic.name}" successfully!`);
      setDeleteConfirm({ isOpen: false, topic: null });

      const data = await triggerFetchITData().unwrap();
      if (data) setITTopics(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete IT topic.");
    }
  };

  const handleStatusToggle = async (
    topic: ITTopic,
    newStatus: ProgressStatus,
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];
    let startedDate = topic.startedDate || "";
    let completedDate = topic.completedDate || "";

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
      id: topic.id,
      name: topic.name,
      domain: "IT" as const,
      sheetName: "IT",
      status: newStatus,
      comments: topic.comments || "",
      startedDate,
      targetToCompleteDate: topic.targetToCompleteDate || "",
      completedDate,
      links: topic.links || [],
    };

    try {
      await executeAdminAction({
        action: "UPDATE",
        domain: "IT",
        sheetName: "IT",
        payload,
      }).unwrap();

      toast.success(
        `Topic status updated to ${newStatus.replace("_", " ").toLowerCase()}!`,
      );
      const data = await triggerFetchITData().unwrap();
      if (data) setITTopics(data);
    } catch {
      toast.error("Failed to update status on Google Sheet.");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTopicId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverTopicId !== id) {
      setDragOverTopicId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverTopicId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverTopicId(null);
    const sourceId = draggedTopicId;
    if (sourceId && sourceId !== targetId) {
      try {
        await executeAdminAction({
          action: "SWAP",
          domain: "IT",
          sheetName: "IT",
          payload: { id1: sourceId, id2: targetId, domain: "IT", sheetName: "IT" },
        }).unwrap();

        toast.success("Topics reordered successfully!");
        const data = await triggerFetchITData().unwrap();
        if (data) setITTopics(data);
      } catch {
        toast.error("Failed to reorder IT topics.");
      }
    }
    setDraggedTopicId(null);
  };

  const handleDragEnd = () => {
    setDraggedTopicId(null);
    setDragOverTopicId(null);
  };

  const getTextColor = (status: ProgressStatus) => {
    if (status === ProgressStatus.COMPLETED) return "text-status-completed";
    if (status === ProgressStatus.IN_PROGRESS) return "text-status-progress";
    if (status === ProgressStatus.OVERDUE) return "text-red-500";
    return "text-status-notstarted";
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-bg-surface p-6 md:p-8 border border-border-subtle glass-panel">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
            <Code className="h-3.5 w-3.5" />
            <span>IT Study Domain</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            IT Topics & Progress
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Track and master computer science, software engineering, systems, and algorithms topics.
          </p>
        </div>
      </div>

      {/* Progress & Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center justify-between gap-4 border-l-4 border-l-primary">
          <div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
              Total Topics
            </p>
            <p className="text-2xl font-black text-text-primary font-numbers">
              {breakdown.total}
            </p>
          </div>
          <ProgressCircle
            percentage={stats.percentage}
            size={64}
            strokeWidth={5}
          />
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-status-completed">
          <div className="h-10 w-10 rounded-full bg-status-completed/10 flex items-center justify-center text-status-completed">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
              Completed
            </p>
            <p className="text-2xl font-black text-text-primary font-numbers">
              {breakdown.completed}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-status-progress">
          <div className="h-10 w-10 rounded-full bg-status-progress/10 flex items-center justify-center text-status-progress">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
              In Progress
            </p>
            <p className="text-2xl font-black text-text-primary font-numbers">
              {breakdown.inProgress}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 border-l-4 border-l-red-500">
          <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
              Overdue
            </p>
            <p className="text-2xl font-black text-text-primary font-numbers">
              {breakdown.overdue}
            </p>
          </div>
        </Card>
      </div>

      {/* Control Bar: Filter, Search, and Add Topic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search IT topics or notes..."
              className="w-full bg-bg-surface border border-border-subtle rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-text-muted" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm text-text-primary focus:outline-none cursor-pointer"
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
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isMutating}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-text-primary rounded-lg font-medium hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add IT Topic
        </button>
      </div>

      {/* Topics List Card */}
      <Card className="p-4 sm:p-6">
        <h2 className="font-bold text-lg text-text-primary mb-6 border-b border-border-subtle pb-4">
          IT Study Topics
        </h2>

        {filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-bg-surface-hover flex items-center justify-center text-text-muted">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-text-primary">
              {itTopics.length === 0
                ? "No IT topics found"
                : "No matching IT topics"}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm">
              {itTopics.length === 0
                ? "Add your first IT topic to start tracking your progress."
                : "Try adjusting your filter or search criteria."}
            </p>
            {itTopics.length === 0 && (
              <button
                onClick={handleCreate}
                className="mt-2 px-4 py-2 text-xs font-semibold bg-primary text-text-primary hover:bg-primary-hover rounded-lg transition-colors cursor-pointer"
              >
                Add Your First Topic
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTopics.map((topic, index) => {
              const isDragged = draggedTopicId === topic.id;
              const isDragOver = dragOverTopicId === topic.id;

              return (
                <div
                  key={topic.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, topic.id)}
                  onDragOver={(e) => handleDragOver(e, topic.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, topic.id)}
                  onDragEnd={handleDragEnd}
                  className={clsx(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all duration-200 gap-4 group cursor-grab active:cursor-grabbing",
                    "bg-bg-surface/20 border-border-subtle hover:bg-bg-surface/40 hover:border-border-focus",
                    isDragged && "opacity-40 scale-95 border-dashed border-primary",
                    isDragOver &&
                      "scale-[1.01] ring-2 ring-primary ring-offset-2 ring-offset-bg-base",
                  )}
                >
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-text-muted font-numbers px-1.5 py-0.5 rounded bg-bg-surface border border-border-subtle">
                        {index + 1}
                      </span>
                      <h3
                        onClick={() => handleEdit(topic)}
                        className={clsx(
                          "text-base font-bold break-words whitespace-normal hover:underline cursor-pointer",
                          getTextColor(topic.status),
                        )}
                      >
                        {topic.name}
                      </h3>
                      <span
                        className={clsx(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium border font-numbers",
                          topic.status === ProgressStatus.COMPLETED &&
                            "bg-status-completed-bg text-status-completed border-status-completed/30",
                          topic.status === ProgressStatus.IN_PROGRESS &&
                            "bg-status-progress-bg text-status-progress border-status-progress/30",
                          topic.status === ProgressStatus.OVERDUE &&
                            "bg-red-500/10 text-red-400 border-red-500/30",
                          topic.status === ProgressStatus.NOT_STARTED &&
                            "bg-status-notstarted-bg text-status-notstarted border-status-notstarted/30",
                        )}
                      >
                        {topic.status.replace("_", " ")}
                      </span>
                    </div>

                    {topic.comments && (
                      <p className="text-xs text-text-muted italic break-words whitespace-normal ml-7">
                        {topic.comments}
                      </p>
                    )}

                    {(topic.startedDate ||
                      topic.targetToCompleteDate ||
                      topic.completedDate) && (
                      <div className="flex flex-wrap gap-3 text-[10px] font-medium ml-7">
                        {topic.startedDate && (
                          <span className="text-text-muted">
                            Started: {topic.startedDate}
                          </span>
                        )}
                        {topic.targetToCompleteDate && (
                          <span className="text-yellow-500">
                            Target: {topic.targetToCompleteDate}
                          </span>
                        )}
                        {topic.completedDate && (
                          <span className="text-status-completed">
                            Completed: {topic.completedDate}
                          </span>
                        )}
                      </div>
                    )}

                    {topic.links && topic.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 ml-7 pt-1">
                        {topic.links.map((link, idx) => (
                          <a
                            key={idx}
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors max-w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {link.title || link.link}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {/* In Progress Quick Button */}
                    <button
                      onClick={() => {
                        const newStatus =
                          topic.status === ProgressStatus.IN_PROGRESS ||
                          topic.status === ProgressStatus.OVERDUE
                            ? ProgressStatus.NOT_STARTED
                            : ProgressStatus.IN_PROGRESS;
                        handleStatusToggle(topic, newStatus);
                      }}
                      className={clsx(
                        "px-2.5 py-1 text-xs font-semibold rounded transition-all duration-200 cursor-pointer",
                        topic.status === ProgressStatus.IN_PROGRESS ||
                          topic.status === ProgressStatus.OVERDUE
                          ? "bg-yellow-500 text-black border-2 border-yellow-300 shadow-md shadow-yellow-500/20 font-bold"
                          : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 hover:bg-yellow-500/25",
                      )}
                      title="Mark as In Progress"
                    >
                      In Progress
                    </button>

                    {/* Done Quick Button */}
                    <button
                      onClick={() => {
                        const newStatus =
                          topic.status === ProgressStatus.COMPLETED
                            ? ProgressStatus.NOT_STARTED
                            : ProgressStatus.COMPLETED;
                        handleStatusToggle(topic, newStatus);
                      }}
                      className={clsx(
                        "px-2.5 py-1 text-xs font-semibold rounded transition-all duration-200 cursor-pointer",
                        topic.status === ProgressStatus.COMPLETED
                          ? "bg-emerald-500 text-black border-2 border-emerald-300 shadow-md shadow-emerald-500/20 font-bold"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25",
                      )}
                      title="Mark as Done"
                    >
                      Done
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEdit(topic)}
                      className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg-surface rounded-lg transition-colors cursor-pointer"
                      title="Edit topic"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() =>
                        setDeleteConfirm({ isOpen: true, topic })
                      }
                      className="p-1.5 text-text-muted hover:text-red-400 hover:bg-bg-surface rounded-lg transition-colors cursor-pointer"
                      title="Delete topic"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <ITTopicFormModal
          initialData={editingTopic}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          isSaving={isMutating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.topic && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-base border border-border-subtle rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Delete IT Topic
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-text-primary">
                "{deleteConfirm.topic.name}"
              </span>
              ? This action will remove it from the Google Sheet.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, topic: null })
                }
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isMutating}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isMutating ? "Deleting..." : "Delete Topic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
ITPage.displayName = "ITPage";
