import React from "react";
import { useNavigate } from "react-router-dom";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateProgress } from "../../utils/progress";
import { Card } from "../../components/ui/Card";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import { BookOpen } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const subjects = useStudyStore((state) => state.subjects);
  // const isFallback = useStudyStore((state) => state.isFallback);
  const isFallback = useStudyStore(() => false); // Temporarily hardcoded to false since we're not implementing fallback logic in this version
  const errorMsg = useStudyStore((state) => state.errorMsg);
  const navigate = useNavigate();

  const overallStats = subjects.reduce(
    (acc, subj) => {
      const stats = calculateProgress(subj);
      return {
        completed: acc.completed + stats.completed,
        total: acc.total + stats.total,
      };
    },
    { completed: 0, total: 0 },
  );

  const overallPercentage =
    overallStats.total > 0
      ? Math.round((overallStats.completed / overallStats.total) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent p-6 md:p-8 border border-border-subtle">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="flex items-center gap-2">
            {isFallback ? (
              <span
                className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-status-progress-bg text-status-progress border border-status-progress/25 cursor-help"
                title={errorMsg}
              >
                Local JSON (Fallback)
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-status-completed-bg text-status-completed border border-status-completed/25">
                Google Sheets Synced
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome to your Study Dashboard
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Track and visualize your nested subjects and chapters. Dynamic
            calculations computed from leaf nodes.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Overall Progress: {overallPercentage}%
            </span>
            <span className="text-xs text-text-muted">
              {overallStats.completed} of {overallStats.total} leaf chapters
              completed
            </span>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] hidden md:block">
          <BookOpen className="h-32 w-32 text-primary" />
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div>
        <h2 className="text-lg font-bold text-text-primary mb-5 tracking-tight">
          Your Subjects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subjects.map((subj) => {
            const stats = calculateProgress(subj);

            return (
              <Card
                key={subj.id}
                interactive
                onClick={() => navigate(`/subject/${subj.id}`)}
                className="flex flex-col items-center text-center justify-between h-full gap-5 group"
              >
                <div className="space-y-2 w-full">
                  <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors truncate">
                    {subj.name}
                  </h3>
                  <p className="text-xs text-text-muted">
                    {stats.completed} / {stats.total} Leaf Chapters
                  </p>
                </div>

                <div className="py-2">
                  <ProgressCircle
                    percentage={stats.percentage}
                    size={110}
                    strokeWidth={9}
                  />
                </div>

                <span className="text-xs font-medium text-primary bg-primary/5 border border-primary/15 px-3 py-1 rounded-lg group-hover:bg-primary group-hover:text-text-primary transition-all duration-200">
                  View Details
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
DashboardPage.displayName = "DashboardPage";
