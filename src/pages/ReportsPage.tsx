import { useMemo } from "react";
import { Card, CardHeader, PageHeader, StatCard } from "../components/ui";
import { useSubjects, useTopics } from "../features/study/hooks/useStudyData";
import { BarList } from "../features/reports/components/BarList";
import { StatusBreakdown } from "../features/reports/components/StatusBreakdown";
import { collectLeaves, countByStatus, toStats } from "../lib/tree";

export function BcsReportPage() {
  const { subjects } = useSubjects();

  const { items, counts, marks } = useMemo(() => {
    const leaves = subjects.flatMap((s) => collectLeaves(s.children));
    // Completed marks: a subject's marks weighted by its completion.
    const earned = subjects.reduce((n, s) => n + (s.marks * s.stats.percentage) / 100, 0);
    return {
      items: [...subjects]
        .sort((a, b) => b.stats.percentage - a.stats.percentage)
        .map((s) => ({
          key: s.row.id,
          label: s.row.name,
          value: s.stats.percentage,
          detail: `${s.stats.completed}/${s.stats.total}`,
        })),
      counts: countByStatus(leaves.map((l) => l.status)),
      marks: { total: subjects.reduce((n, s) => n + s.marks, 0), earned: Math.round(earned) },
    };
  }, [subjects]);

  const total = toStats(counts.COMPLETED, Object.values(counts).reduce((a, b) => a + b, 0));

  return (
    <div className="space-y-6">
      <PageHeader title="BCS report" description="Completion by subject, based on finished chapters." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Overall" value={`${total.percentage}%`} hint={`${total.completed} of ${total.total} chapters`} />
        <StatCard label="Marks covered (est.)" value={`${marks.earned} / ${marks.total}`} hint="Subject marks × completion" />
        <StatCard label="Subjects complete" value={`${subjects.filter((s) => s.stats.percentage === 100 && s.stats.total > 0).length} / ${subjects.length}`} />
      </div>
      <Card>
        <CardHeader title="Chapter status" />
        <div className="p-4 sm:p-5">
          <StatusBreakdown counts={counts} />
        </div>
      </Card>
      <Card>
        <CardHeader title="Completion by subject" description="Sorted from most to least complete" />
        <div className="p-4 sm:p-5">
          <BarList items={items} />
        </div>
      </Card>
    </div>
  );
}

export function ItReportPage() {
  const { topics } = useTopics();
  const counts = useMemo(() => countByStatus(topics.map((t) => t.status)), [topics]);
  const stats = toStats(counts.COMPLETED, topics.length);

  return (
    <div className="space-y-6">
      <PageHeader title="IT report" description="Status distribution across your IT topics." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Overall" value={`${stats.percentage}%`} hint={`${stats.completed} of ${stats.total} topics`} />
        <StatCard label="Active" value={counts.IN_PROGRESS + counts.OVERDUE} hint={`${counts.OVERDUE} overdue`} tone="info" />
        <StatCard label="Remaining" value={stats.total - stats.completed} tone="neutral" />
      </div>
      <Card>
        <CardHeader title="Topic status" />
        <div className="p-4 sm:p-5">
          <StatusBreakdown counts={counts} />
        </div>
      </Card>
    </div>
  );
}
