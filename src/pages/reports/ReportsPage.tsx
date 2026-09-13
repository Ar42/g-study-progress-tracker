import React, { useMemo } from "react";
import { useStudyStore } from "../../stores/useStudyStore";
import {
  calculateProgress,
  calculateITProgress,
  getITStatusBreakdown,
} from "../../utils/progress";
import { Card } from "../../components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FileSpreadsheet, BarChart3, CheckCircle, Timer, AlertTriangle, ListChecks } from "lucide-react";
import type { StudyDomain } from "../../types";

interface ReportsPageProps {
  readonly domain?: StudyDomain;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ domain = "BCS" }) => {
  const subjects = useStudyStore((state) => state.subjects);
  const itTopics = useStudyStore((state) => state.itTopics);

  const bcsChartData = useMemo(() => {
    return subjects.map((subj) => {
      const stats = calculateProgress(subj);
      return {
        name: subj.name,
        completion: stats.percentage,
      };
    });
  }, [subjects]);

  const itBreakdown = useMemo(() => getITStatusBreakdown(itTopics), [itTopics]);
  const itProgress = useMemo(() => calculateITProgress(itTopics), [itTopics]);

  const itStatusDistribution = useMemo(() => {
    return [
      { name: "Completed", count: itBreakdown.completed, fill: "var(--status-completed)" },
      { name: "In Progress", count: itBreakdown.inProgress, fill: "var(--status-progress)" },
      { name: "Overdue", count: itBreakdown.overdue, fill: "#ef4444" },
      { name: "Not Started", count: itBreakdown.notStarted, fill: "var(--status-notstarted)" },
    ];
  }, [itBreakdown]);

  if (domain === "IT") {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-bg-surface p-6 md:p-8 border border-border-subtle glass-panel">
          <div className="relative z-10 max-w-xl space-y-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              IT Study Reports
            </h1>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed">
              Analyze your completion metrics, topic distributions, and deadlines for the IT study module.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 flex items-center gap-4 border-l-4 border-l-primary">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">
                Total Topics
              </p>
              <p className="text-2xl font-black text-text-primary font-numbers">
                {itBreakdown.total}
              </p>
            </div>
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
                {itBreakdown.completed} ({itProgress.percentage}%)
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
                {itBreakdown.inProgress}
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
                {itBreakdown.overdue}
              </p>
            </div>
          </Card>
        </div>

        {/* Status Distribution Bar Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-text-primary mb-6 tracking-tight">
            IT Topics Status Breakdown
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={itStatusDistribution}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--bg-surface-hover)" }}
                  contentStyle={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1200}>
                  {itStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    );
  }

  // BCS Domain Reports (Default)
  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-bg-surface p-6 md:p-8 border border-border-subtle glass-panel">
        <div className="relative z-10 max-w-xl space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            BCS Subject Reports
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Visualize your completion percentage across all BCS subjects and chapters.
          </p>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold text-text-primary mb-6 tracking-tight">
          Subject Completion Chart
        </h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={bcsChartData}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "var(--bg-surface-hover)" }}
                contentStyle={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-subtle)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                }}
                itemStyle={{ color: "var(--primary)" }}
              />
              <Bar
                dataKey="completion"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              >
                {bcsChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.completion === 100 ? "var(--status-completed)" : "var(--primary)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

ReportsPage.displayName = "ReportsPage";
