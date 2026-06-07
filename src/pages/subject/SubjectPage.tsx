import React from "react";
import { useParams, Link } from "react-router-dom";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateProgress } from "../../utils/progress";
import { TreeNode } from "../../features/subjects/components/TreeNode";
import { Card } from "../../components/ui/Card";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import { ChevronLeft, BookOpen, AlertTriangle } from "lucide-react";

export const SubjectPage: React.FC = () => {
  const { subjectId } = useParams<{ readonly subjectId: string }>();
  const subjects = useStudyStore((state) => state.subjects);

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
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary">
            {subject.name}
          </h1>
          <p className="text-text-secondary text-sm">
            Recursive tree hierarchy breakdown and progress tracking.
          </p>
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
            <TreeNode key={child.id} node={child} subjectId={subject.id} />
          ))}
        </div>
      </Card>
    </div>
  );
};
SubjectPage.displayName = "SubjectPage";
