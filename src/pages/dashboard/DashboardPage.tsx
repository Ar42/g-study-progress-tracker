import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateProgress } from "../../utils/progress";
import { Card } from "../../components/ui/Card";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import {
  BookOpen,
  Award,
  CheckCircle,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { intervalToDuration, formatDuration } from "date-fns";
import { ProgressStatus } from "../../enums/progress";
import { TreeNode } from "../../features/subjects/components/TreeNode";
import { useExecuteAdminActionMutation } from "../../services/adminApi";
import { useLazyFetchStudyDataQuery } from "../../services/sheetApi";
import { toast } from "sonner";
import { clsx } from "clsx";

export const DashboardPage: React.FC = () => {
  const subjects = useStudyStore((state) => state.subjects);
  const navigate = useNavigate();

  const EXAM_DATE = new Date("2026-08-31T00:00:00");
  // const COUNT_DOWN_LABEL = "Exam Countdown";
  const COUNT_DOWN_LABEL = "Syllabus Completion Time Left";
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      if (EXAM_DATE.getTime() - now.getTime() > 0) {
        const duration = intervalToDuration({ start: now, end: EXAM_DATE });
        setTimeLeft(
          formatDuration(duration, {
            format: ["years", "months", "weeks", "days", "hours", "minutes"],
          }) || "0 minutes",
        );
      } else {
        setTimeLeft("Exam day is here!");
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const [executeAdminAction] = useExecuteAdminActionMutation();
  const [triggerFetch] = useLazyFetchStudyDataQuery();
  const setSubjects = useStudyStore((state) => state.setSubjects);
  const updateLeafStatus = useStudyStore((state) => state.updateLeafStatus);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    subjectId?: string;
    nodeId?: string;
    nodeName?: string;
    node?: any;
  }>({ isOpen: false });

  // Drag and Drop State for Subjects
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);
  const [dragOverSubjectId, setDragOverSubjectId] = useState<string | null>(
    null,
  );

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedSubjectId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (dragOverSubjectId !== id) {
      setDragOverSubjectId(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverSubjectId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverSubjectId(null);
    const sourceId = draggedSubjectId;
    if (sourceId && sourceId !== targetId) {
      try {
        await executeAdminAction({
          action: "SWAP",
          payload: { id1: sourceId, id2: targetId },
        }).unwrap();

        toast.success("Subjects reordered successfully!");
        const data = await triggerFetch().unwrap();
        if (data) setSubjects(data);
      } catch {
        toast.error("Failed to reorder subjects.");
      }
    }
    setDraggedSubjectId(null);
  };

  const handleDragEnd = () => {
    setDraggedSubjectId(null);
    setDragOverSubjectId(null);
  };

  function filterTreeByStatus(
    nodes: readonly any[],
    statusToKeep: ProgressStatus,
    subjectId: string,
  ): any[] {
    return nodes
      .map((node) => {
        if ("children" in node && Array.isArray(node.children)) {
          const filteredChildren = filterTreeByStatus(
            node.children,
            statusToKeep,
            subjectId,
          );
          if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
          return null;
        } else {
          return node.status === statusToKeep
            ? { ...node, _subjectId: subjectId }
            : null;
        }
      })
      .filter(Boolean);
  }

  const overdueSubjects = subjects
    .map((subj) => {
      const filtered = filterTreeByStatus(
        subj.children,
        ProgressStatus.OVERDUE,
        subj.id,
      );
      return filtered.length > 0 ? { ...subj, children: filtered } : null;
    })
    .filter(Boolean);

  const inProgressSubjects = subjects
    .map((subj) => {
      const filtered = filterTreeByStatus(
        subj.children,
        ProgressStatus.IN_PROGRESS,
        subj.id,
      );
      return filtered.length > 0 ? { ...subj, children: filtered } : null;
    })
    .filter(Boolean);

  const handleNodeClick = (node: any, subjectId: string) => {
    if (!("children" in node)) {
      setConfirmModal({
        isOpen: true,
        subjectId: subjectId,
        nodeId: node.id,
        nodeName: node.name,
        node: node,
      });
    }
  };

  const confirmCompletion = async () => {
    if (confirmModal.subjectId && confirmModal.nodeId && confirmModal.node) {
      const node = confirmModal.node;
      const todayStr = new Date().toISOString().split("T")[0];
      const payload = {
        id: node.id,
        name: node.name,
        is_subject: false,
        parentId: node.parentId || confirmModal.subjectId,
        status: ProgressStatus.COMPLETED,
        preliMarks: node.preliMarks ? String(node.preliMarks) : "",
        comments: node.comments || "",
        startedDate: node.startedDate || todayStr,
        targetToCompleteDate: node.targetToCompleteDate || "",
        completedDate: todayStr,
        links: node.links || [],
      };

      try {
        await executeAdminAction({
          action: "UPDATE",
          payload,
        }).unwrap();

        toast.success(`Chapter "${node.name}" marked as completed!`);
        const data = await triggerFetch().unwrap();
        if (data) setSubjects(data);
      } catch (err) {
        toast.error("Failed to update status on Google Sheet.");
      }
    } else {
      if (confirmModal.subjectId && confirmModal.nodeId) {
        updateLeafStatus(
          confirmModal.subjectId,
          confirmModal.nodeId,
          ProgressStatus.COMPLETED,
        );
      }
    }
    setConfirmModal({ isOpen: false });
  };

  const totalModules = subjects.length;

  const overallPercentage =
    totalModules > 0
      ? Math.round(
          subjects.reduce(
            (sum, subj) => sum + calculateProgress(subj).percentage,
            0,
          ) / totalModules,
        )
      : 0;

  const totalSubjectsMarks = subjects.reduce((sum, subj) => {
    return sum + (Number(subj.preliMarks) || 0);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-bg-surface/90 via-bg-surface to-primary/5 p-6 md:p-8 border border-border-subtle shadow-xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-0" />
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
            Active Study Board
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary">
            Welcome to your Study Dashboard
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Track and visualize your nested subjects and chapters. Dynamic
            calculations computed from leaf nodes.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/25 shadow-sm">
              Overall Progress:{" "}
              <span className="font-numbers text-sm">{overallPercentage}%</span>
            </span>
            <span className="text-xs text-text-muted">
              <span className="font-numbers text-text-secondary font-bold">{overallPercentage}%</span> from{" "}
              <span className="font-numbers text-text-secondary font-bold">{totalModules}</span> modules are
              completed
            </span>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.04] hidden md:block">
          <BookOpen className="h-44 w-44 text-primary" />
        </div>
      </div>

      {/* Overdue Section */}
      {overdueSubjects.length > 0 && (
        <div className="border border-red-500/30 bg-gradient-to-r from-red-950/20 via-bg-surface/80 to-bg-surface/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-red-950/20">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 border border-red-500/30">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-400">Overdue Chapters</h2>
                <p className="text-xs text-text-muted">Target dates passed and require immediate completion</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/25">
              Action Required
            </span>
          </div>
          <div className="space-y-4">
            {overdueSubjects.map((subj: any) => (
              <div key={subj.id} className="space-y-2">
                <h3 className="text-xs font-extrabold text-red-400/80 uppercase tracking-wider">
                  {subj.name}
                </h3>
                {subj.children.map((child: any) => (
                  <TreeNode
                    key={child.id}
                    node={child}
                    subjectId={subj.id}
                    onEdit={handleNodeClick}
                    filterStatus="ALL"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Section */}
      {inProgressSubjects.length > 0 && (
        <div className="border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-bg-surface/80 to-bg-surface/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-amber-950/20">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30">
                <Timer className="h-4.5 w-4.5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-amber-400">In Progress</h2>
                <p className="text-xs text-text-muted">Chapters currently being studied</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
              In Focus
            </span>
          </div>
          <div className="space-y-4">
            {inProgressSubjects.map((subj: any) => (
              <div key={subj.id} className="space-y-2">
                <h3 className="text-xs font-extrabold text-amber-400/80 uppercase tracking-wider">
                  {subj.name}
                </h3>
                {subj.children.map((child: any) => (
                  <TreeNode
                    key={child.id}
                    node={child}
                    subjectId={subj.id}
                    onEdit={handleNodeClick}
                    filterStatus="ALL"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Countdown Timer */}
      <div className="glass-panel rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-secondary relative overflow-hidden shadow-xl">
        <div className="flex items-center gap-4 z-10">
          <div className="h-12 w-12 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/30 shadow-inner">
            <Timer className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              {COUNT_DOWN_LABEL}
            </h3>
            <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-secondary font-numbers drop-shadow-sm">
              {timeLeft || "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Card className="p-6 flex items-center justify-between gap-4 border-l-4 border-l-primary hover:-translate-y-1 transition-all duration-300 shadow-xl group">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center text-primary border border-primary/25 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                Total Marks
              </p>
              <p className="text-3xl font-black text-text-primary font-numbers">
                {totalSubjectsMarks}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between gap-4 border-l-4 border-l-secondary hover:-translate-y-1 transition-all duration-300 shadow-xl group">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/25 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                Overall Completion
              </p>
              <p className="text-3xl font-black text-text-primary font-numbers">
                {overallPercentage}%
              </p>
            </div>
          </div>
          <ProgressCircle
            percentage={overallPercentage}
            size={80}
            strokeWidth={6}
          />
        </Card>
      </div>

      {/* Grid of Subject Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Your Subjects
            </h2>
            <p className="text-xs text-text-muted">Drag to reorder subjects priority</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-bg-surface border border-border-subtle text-text-secondary">
            {subjects.length} Active Modules
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((subj) => {
            const stats = calculateProgress(subj);
            const isDragged = draggedSubjectId === subj.id;
            const isDragOverThis = dragOverSubjectId === subj.id;

            return (
              <div
                key={subj.id}
                draggable
                onDragStart={(e) => handleDragStart(e, subj.id)}
                onDragOver={(e) => handleDragOver(e, subj.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, subj.id)}
                onDragEnd={handleDragEnd}
                className={clsx(
                  "transition-all duration-200",
                  isDragged &&
                    "opacity-40 scale-95 border-dashed border-primary",
                  isDragOverThis &&
                    "scale-[1.02] ring-2 ring-primary ring-offset-2 ring-offset-bg-base",
                )}
              >
                <Card
                  interactive
                  onClick={(e: React.MouseEvent) => {
                    if (e.ctrlKey || e.metaKey) {
                      window.open(`/subject/${subj.id}`, "_blank");
                    } else {
                      navigate(`/subject/${subj.id}`);
                    }
                  }}
                  className="flex flex-col items-center text-center justify-between h-full gap-5 group p-6 glass-panel-interactive border border-border-subtle/80 hover:border-primary/50 cursor-grab active:cursor-grabbing w-full rounded-2xl"
                >
                  <div className="space-y-2.5 w-full">
                    <div className="flex flex-col items-center gap-2">
                      <h3 className="font-extrabold text-lg text-text-primary group-hover:text-primary transition-colors break-words whitespace-normal w-full text-center leading-snug">
                        {subj.name}
                      </h3>
                      {subj.preliMarks && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30 font-numbers">
                          Preli: {subj.preliMarks} Marks
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted font-numbers">
                      {stats.completed} / {stats.total} Leaf Chapters
                    </p>
                  </div>

                  <div className="py-2 group-hover:scale-105 transition-transform duration-300">
                    <ProgressCircle
                      percentage={stats.percentage}
                      size={110}
                      strokeWidth={9}
                    />
                  </div>

                  <span className="text-xs font-semibold text-primary bg-primary/10 border border-primary/25 px-3.5 py-1.5 rounded-xl group-hover:bg-primary group-hover:text-text-primary group-hover:shadow-md group-hover:shadow-primary/25 transition-all duration-200">
                    View Hierarchy
                  </span>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-base border border-border-subtle rounded-xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">
              Mark as Completed
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to mark{" "}
              <span className="font-semibold text-text-primary">
                {confirmModal.nodeName}
              </span>{" "}
              as completed?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmCompletion}
                className="px-4 py-2 text-sm font-medium text-text-primary bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
DashboardPage.displayName = "DashboardPage";
