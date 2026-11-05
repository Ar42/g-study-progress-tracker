import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AlertTriangle, BookOpen, BookOpenCheck, Code2 } from "lucide-react";
import { Card, CardHeader, EmptyState, ProgressRing, StatCard, StatusBar, TONE_FILL } from "../components/ui";
import { useSubjects, useTopics } from "../features/study/hooks/useStudyData";
import { FocusModal } from "../features/dashboard/components/FocusModal";
import { buildFocusGroups, countItems, type FocusStatus } from "../features/dashboard/focus";
import { DeadlineCard } from "../features/dashboard/components/DeadlineCard";
import { SubjectGrid } from "../features/bcs/components/SubjectGrid";
import { statusSegments } from "../features/study/statusSegments";
import { collectLeaves, countByStatus, toStats } from "../lib/tree";
import { cn } from "../lib/cn";

function greeting(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { subjects } = useSubjects();
  const { topics } = useTopics();
  const [focus, setFocus] = useState<FocusStatus | null>(null);

  const overdue = useMemo(() => buildFocusGroups(subjects, topics, "OVERDUE"), [subjects, topics]);
  const active = useMemo(() => buildFocusGroups(subjects, topics, "IN_PROGRESS"), [subjects, topics]);
  const overdueCount = countItems(overdue);
  const activeCount = countItems(active);

  const summary = useMemo(() => {
    const leaves = subjects.flatMap((s) => collectLeaves(s.children));
    const bcsCounts = countByStatus(leaves.map((l) => l.status));
    const itCounts = countByStatus(topics.map((t) => t.status));
    return {
      bcsCounts,
      itCounts,
      bcs: toStats(bcsCounts.COMPLETED, leaves.length),
      it: toStats(itCounts.COMPLETED, topics.length),
    };
  }, [subjects, topics]);

  const now = new Date();
  const segments = statusSegments(summary.bcsCounts);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative animate-rise overflow-hidden p-5 sm:p-7">
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg-subtle">
                {format(now, "EEEE, d MMMM")}
              </p>
              <h1 className="font-display text-2xl font-semibold leading-tight text-fg sm:text-3xl">
                {greeting(now.getHours())}.
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-fg-muted sm:text-base">
                You've finished <span className="font-numbers text-fg">{summary.bcs.completed}</span> of{" "}
                <span className="font-numbers text-fg">{summary.bcs.total}</span> BCS chapters
                {overdueCount > 0 ? (
                  <>
                    {" "}—{" "}
                    <button
                      type="button"
                      onClick={() => setFocus("OVERDUE")}
                      className="cursor-pointer font-semibold text-danger underline decoration-danger/40 underline-offset-4 hover:decoration-danger"
                    >
                      {overdueCount} need catching up
                    </button>
                    .
                  </>
                ) : (
                  ", and nothing is overdue. Nicely done."
                )}
              </p>
            </div>

            <div className="max-w-lg space-y-2.5">
              <StatusBar segments={segments} height="h-2.5" />
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
                {segments.map((s) => (
                  <li key={s.key} className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full", TONE_FILL[s.tone])} />
                    {s.label}
                    <span className="font-numbers text-fg">{s.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hidden md:block">
            <ProgressRing value={summary.bcs.percentage} size={132} stroke={10} />
          </div>
        </div>
      </Card>

      {/* Quick numbers */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Overdue"
          icon={<AlertTriangle />}
          tone={overdueCount > 0 ? "danger" : "success"}
          value={overdueCount}
          hint={overdueCount > 0 ? "Past their target date" : "Everything on schedule"}
          onClick={() => setFocus("OVERDUE")}
        />
        <StatCard
          label="Reading"
          icon={<BookOpenCheck />}
          tone="info"
          value={activeCount}
          hint={activeCount > 0 ? "Chapters & topics in progress" : "Nothing started yet"}
          onClick={() => setFocus("IN_PROGRESS")}
        />
        <StatCard
          label="IT topics"
          icon={<Code2 />}
          tone="primary"
          value={
            <>
              {summary.it.percentage}
              <span className="text-lg text-fg-subtle">%</span>
            </>
          }
          hint={`${summary.it.completed} of ${summary.it.total} done`}
          footer={<StatusBar segments={statusSegments(summary.itCounts)} height="h-1.5" />}
          onClick={() => navigate("/it")}
        />
        <DeadlineCard />
      </div>

      <Card>
        <CardHeader title="BCS subjects" description="Open a subject to manage its chapters · drag cards to reorder" />
        <div className="p-4 sm:p-5">
          {subjects.length === 0 ? (
            <EmptyState icon={<BookOpen />} title="No subjects found" description="Rows with is_subject = TRUE appear here." />
          ) : (
            <SubjectGrid subjects={subjects} />
          )}
        </div>
      </Card>

      <FocusModal status={focus} groups={focus === "OVERDUE" ? overdue : active} onClose={() => setFocus(null)} />
    </div>
  );
}
