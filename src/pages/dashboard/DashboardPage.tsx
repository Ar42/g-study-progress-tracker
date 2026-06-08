import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateProgress } from "../../utils/progress";
import { Card } from "../../components/ui/Card";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import { BookOpen, Award, CheckCircle, Timer } from "lucide-react";
import { intervalToDuration, formatDuration } from "date-fns";

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
        setTimeLeft(formatDuration(duration, { format: ['years', 'months', 'weeks', 'days', 'hours', 'minutes'] }) || "0 minutes");
      } else {
        setTimeLeft("Exam day is here!");
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="relative overflow-hidden rounded-2xl bg-bg-surface p-6 md:p-8 border border-border-subtle">
        <div className="relative z-10 max-w-xl space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome to your Study Dashboard
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Track and visualize your nested subjects and chapters. Dynamic
            calculations computed from leaf nodes.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Overall Progress:{" "}
              <span className="font-numbers">{overallPercentage}%</span>
            </span>
            <span className="text-xs text-text-muted">
              <span className="font-numbers">{overallPercentage}%</span> from{" "}
              <span className="font-numbers">{totalModules}</span> modules are
              completed
            </span>
          </div>
        </div>
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] hidden md:block">
          <BookOpen className="h-32 w-32 text-primary" />
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-l-4 border-l-secondary relative overflow-hidden">
        <div className="flex items-center gap-4 z-10">
          <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shadow-inner">
            <Timer className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">
              {COUNT_DOWN_LABEL}
            </h3>
            <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-numbers drop-shadow-sm">
              {timeLeft || "Loading..."}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 flex items-center justify-between gap-4 border-l-4 border-l-primary hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Award className="h-6 w-6" />
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

        <Card className="p-5 flex items-center justify-between gap-4 border-l-4 border-l-secondary hover:-translate-y-1 transition-transform">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <CheckCircle className="h-6 w-6" />
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
            strokeWidth={5}
          />
        </Card>
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
                className="flex flex-col items-center text-center justify-between h-full gap-5 group p-6 glass-panel-interactive border-t border-t-white/5"
              >
                <div className="space-y-2 w-full">
                  <div className="flex flex-col items-center gap-1.5">
                    <h3 className="font-bold text-lg text-text-primary group-hover:text-primary transition-colors break-words whitespace-normal w-full text-center">
                      {subj.name}
                    </h3>
                    {subj.preliMarks && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 font-numbers">
                        Preli Marks: {subj.preliMarks}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1 font-numbers">
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
