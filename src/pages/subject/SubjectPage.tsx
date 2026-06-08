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
  Calendar,
  MessageSquare,
  ExternalLink,
  Link as LinkIcon,
  Target,
  CheckCircle2,
  Plus,
  Filter
} from "lucide-react";

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

  const sortedLinks = subject.links ? [...subject.links].sort((a, b) => {
    const nameA = a.sourceName?.toLowerCase() || "";
    const nameB = b.sourceName?.toLowerCase() || "";
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  }) : [];

  const handleCreateChapter = () => {
    setEditingNode(null);
    setIsModalOpen(true);
  };

  const handleEditChapter = (node: any) => {
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const onSave = async (payload: any) => {
    const action = editingNode ? "UPDATE" : "CREATE";
    try {
      await executeAdminAction({
        action,
        payload
      }).unwrap();
      
      toast.success(`Chapter ${action === "CREATE" ? "created" : "updated"} successfully!`);
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
              className="bg-transparent text-sm text-text-primary focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value={ProgressStatus.COMPLETED}>Completed</option>
              <option value={ProgressStatus.IN_PROGRESS}>In Progress</option>
              <option value={ProgressStatus.NOT_STARTED}>Not Started</option>
            </select>
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
      <Card className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6">
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
      <Card className="p-6">
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
            />
          ))}
        </div>
      </Card>

      {/* Details Section */}
      {(subject.comments ||
        subject.startedDate ||
        subject.targetToCompleteDate ||
        subject.completedDate) && (
        <div>
          {/* Details Card */}
          {(subject.comments ||
            subject.startedDate ||
            subject.targetToCompleteDate ||
            subject.completedDate) && (
            <Card className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 border-b border-border-subtle pb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg text-text-primary">
                  Subject Details
                </h3>
              </div>
              <div className="space-y-4 flex-1">
                {subject.startedDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-text-muted mt-0.5" />
                    <div>
                      <span className="text-xs text-text-muted block">
                        Started Date
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {subject.startedDate}
                      </span>
                    </div>
                  </div>
                )}
                {subject.targetToCompleteDate && (
                  <div className="flex items-start gap-3">
                    <Target className="h-4 w-4 text-status-progress mt-0.5" />
                    <div>
                      <span className="text-xs text-text-muted block">
                        Target to Complete
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {subject.targetToCompleteDate}
                      </span>
                    </div>
                  </div>
                )}
                {subject.completedDate && (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-status-completed mt-0.5" />
                    <div>
                      <span className="text-xs text-text-muted block">
                        Completed Date
                      </span>
                      <span className="text-sm font-medium text-text-primary">
                        {subject.completedDate}
                      </span>
                    </div>
                  </div>
                )}
                {subject.comments && (
                  <div className="flex items-start gap-3 bg-bg-surface-hover p-3 rounded-lg border border-border-subtle">
                    <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs text-text-muted block mb-1">
                        Comments
                      </span>
                      <p className="text-sm text-text-secondary leading-relaxed break-words whitespace-normal">
                        {subject.comments}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Links Section */}
      {sortedLinks && sortedLinks.length > 0 && (
        <div>
          {/* Links Card */}
          {sortedLinks && sortedLinks.length > 0 && (
            <Card className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-4 border-b border-border-subtle pb-3">
                <LinkIcon className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg text-text-primary">
                  Resources & Links
                </h3>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {sortedLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-lg border border-border-subtle bg-bg-surface hover:bg-bg-surface-hover hover:border-primary/30 transition-all group"
                  >
                    <div className="flex flex-col overflow-hidden mr-3">
                      <span className="text-sm font-semibold text-text-primary break-words whitespace-normal group-hover:text-primary transition-colors">
                        {link.title}
                      </span>
                      <span className="text-xs text-text-muted break-words whitespace-normal mt-0.5">
                        Source: {link.sourceName}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-primary transition-colors flex-shrink-0" />
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

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
