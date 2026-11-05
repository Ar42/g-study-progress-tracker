import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, Code2 } from "lucide-react";
import { Card, CardHeader, EmptyState, PageHeader, ProgressRing, StatCard } from "../components/ui";
import { useSubjects, useTopics } from "../features/study/hooks/useStudyData";
import { FocusPanel } from "../features/dashboard/components/FocusPanel";
import { DeadlineCard } from "../features/dashboard/components/DeadlineCard";
import { SubjectGrid } from "../features/bcs/components/SubjectGrid";
import { collectLeaves, countByStatus, toStats } from "../lib/tree";
import { ProgressStatus } from "../enums/progress";

export function DashboardPage() {
  const { subjects } = useSubjects();
  const { topics } = useTopics();

  const summary = useMemo(() => {
    const bcsLeaves = subjects.flatMap((s) => collectLeaves(s.children));
    const bcsCounts = countByStatus(bcsLeaves.map((l) => l.status));
    const itCounts = countByStatus(topics.map((t) => t.status));
    return {
      bcs: toStats(bcsCounts.COMPLETED, bcsLeaves.length),
      it: toStats(itCounts.COMPLETED, topics.length),
      overdue: bcsCounts.OVERDUE + itCounts.OVERDUE,
      marks: subjects.reduce((n, s) => n + s.marks, 0),
    };
  }, [subjects, topics]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your BCS and IT preparation at a glance." />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="BCS progress"
          icon={<BookOpen />}
          value={`${summary.bcs.percentage}%`}
          hint={`${summary.bcs.completed} of ${summary.bcs.total} chapters`}
          aside={<ProgressRing value={summary.bcs.percentage} size={44} stroke={4} showLabel={false} />}
        />
        <StatCard
          label="IT progress"
          icon={<Code2 />}
          value={`${summary.it.percentage}%`}
          hint={`${summary.it.completed} of ${summary.it.total} topics`}
          aside={<ProgressRing value={summary.it.percentage} size={44} stroke={4} showLabel={false} />}
        />
        <StatCard
          label="Overdue"
          icon={<AlertTriangle />}
          tone={summary.overdue > 0 ? "danger" : "success"}
          value={summary.overdue}
          hint={summary.overdue > 0 ? "Past their target date" : "Everything on schedule"}
        />
        <DeadlineCard />
      </div>

      <FocusPanel subjects={subjects} topics={topics} />

      <Card>
        <CardHeader
          title="BCS subjects"
          description="Open a subject to manage its chapters. Drag cards to reorder."
        />
        <div className="p-4 sm:p-5">
          {subjects.length === 0 ? (
            <EmptyState icon={<BookOpen />} title="No subjects found" description="Rows with is_subject = TRUE appear here." />
          ) : (
            <SubjectGrid subjects={subjects} />
          )}
        </div>
      </Card>

      <Link
        to="/it"
        className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong hover:bg-surface-2 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-primary/25 bg-primary-soft text-primary">
            <Code2 className="size-[18px]" />
          </div>
          <div>
            <p className="text-sm font-medium text-fg">IT topics</p>
            <p className="text-xs text-fg-subtle">
              {topics.filter((t) => t.status === ProgressStatus.IN_PROGRESS).length} in progress ·{" "}
              {summary.it.total - summary.it.completed} remaining
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
    </div>
  );
}
