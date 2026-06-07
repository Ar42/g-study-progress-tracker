import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface ProgressCircleProps {
  readonly percentage: number;
  readonly size?: number;
  readonly strokeWidth?: number;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  percentage,
  size = 120,
  strokeWidth = 10,
}) => {
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  
  const data = [
    { name: "Completed", value: normalizedPercentage },
    { name: "Remaining", value: 100 - normalizedPercentage },
  ];

  return (
    <div 
      className="relative inline-flex items-center justify-center select-none" 
      style={{ width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={(size - strokeWidth * 2) / 2}
            outerRadius={size / 2}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={800}
          >
            <Cell fill="var(--primary)" />
            <Cell fill="var(--border-subtle)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tracking-tight text-text-primary">
          {normalizedPercentage}%
        </span>
      </div>
    </div>
  );
};
ProgressCircle.displayName = "ProgressCircle";
