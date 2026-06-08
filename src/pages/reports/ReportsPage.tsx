import React from "react";
import { useStudyStore } from "../../stores/useStudyStore";
import { calculateProgress } from "../../utils/progress";
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
import { FileSpreadsheet } from "lucide-react";

export const ReportsPage: React.FC = () => {
  const subjects = useStudyStore((state) => state.subjects);

  const data = subjects.map((subj) => {
    const stats = calculateProgress(subj);
    return {
      name: subj.name,
      completion: stats.percentage,
    };
  });

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl bg-bg-surface p-6 md:p-8 border border-border-subtle glass-panel">
        <div className="relative z-10 max-w-xl space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Subject Reports
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            Visualize your completion percentage across all subjects.
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
              data={data}
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
                  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
                }}
                itemStyle={{ color: "var(--primary)" }}
              />
              <Bar
                dataKey="completion"
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
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
