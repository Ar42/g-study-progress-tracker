import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Code2, Plus, Search, SearchX } from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  ProgressRing,
  SegmentedControl,
  Spinner,
  StatCard,
} from "../components/ui";
import { useTopics } from "../features/study/hooks/useStudyData";
import { useStudyActions } from "../features/study/hooks/useStudyActions";
import { TopicList } from "../features/it/components/TopicList";
import { TopicEditor, type TopicEditorState } from "../features/it/components/TopicEditor";
import { countByStatus, toStats } from "../lib/tree";
import { STATUS_FILTER_OPTIONS, type StatusFilter } from "../enums/progress";
import { emptyRow } from "../services/rowMapper";
import { generateRowId } from "../lib/id";

export function ITPage() {
  const { topics, isLoading, error } = useTopics();
  const { setStatus, swap } = useStudyActions("IT");
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<TopicEditorState | null>(null);

  const counts = useMemo(() => countByStatus(topics.map((t) => t.status)), [topics]);
  const stats = toStats(counts.COMPLETED, topics.length);
  const position = useMemo(() => new Map(topics.map((t, i) => [t.row.id, i + 1])), [topics]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter(
      (t) =>
        (filter === "ALL" || t.status === filter) &&
        (!q || t.row.name.toLowerCase().includes(q) || t.row.comments.toLowerCase().includes(q)),
    );
  }, [topics, filter, query]);

  const isFiltering = filter !== "ALL" || query.trim() !== "";
  const openCreate = () => setEditor({ mode: "create", row: emptyRow(generateRowId("it")) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT topics"
        description="Computer science and engineering topics, tracked independently from BCS."
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            Add topic
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Completion"
          value={`${stats.percentage}%`}
          hint={`${stats.completed} of ${stats.total}`}
          aside={<ProgressRing value={stats.percentage} size={40} stroke={4} showLabel={false} />}
          className="col-span-2 lg:col-span-1"
        />
        <StatCard label="Completed" icon={<CheckCircle2 />} tone="success" value={counts.COMPLETED} />
        <StatCard label="In progress" icon={<Clock />} tone="info" value={counts.IN_PROGRESS} />
        <StatCard label="Overdue" icon={<AlertTriangle />} tone="danger" value={counts.OVERDUE} className="col-span-2 sm:col-span-1" />
      </div>

      <Card>
        <CardHeader
          title="Topics"
          description={isFiltering ? `${visible.length} of ${topics.length} shown` : "Drag to reorder"}
          actions={
            <SegmentedControl
              ariaLabel="Filter by status"
              value={filter}
              onChange={setFilter}
              segments={STATUS_FILTER_OPTIONS.map((o) => ({
                ...o,
                count: o.value === "ALL" ? topics.length : counts[o.value],
              }))}
            />
          }
        />
        <div className="border-b border-border px-4 py-3 sm:px-5">
          <Input
            leading={<Search />}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics or notes…"
            aria-label="Search topics"
            className="sm:max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-14 text-primary">
            <Spinner />
          </div>
        ) : error && topics.length === 0 ? (
          <EmptyState icon={<AlertTriangle />} title="Couldn't load the IT sheet" description="Use the refresh button to try again." />
        ) : topics.length === 0 ? (
          <EmptyState
            icon={<Code2 />}
            title="No IT topics yet"
            description="Add your first topic to start tracking."
            action={<Button onClick={openCreate}>Add topic</Button>}
          />
        ) : visible.length === 0 ? (
          <EmptyState icon={<SearchX />} title="No topics match" description="Try a different filter or search." />
        ) : (
          <TopicList
            topics={visible}
            numberOf={(id) => position.get(id) ?? 0}
            onEdit={(t) => setEditor({ mode: "edit", row: t.row })}
            onStatusChange={(t, s) => void setStatus(t.row, s)}
            onSwap={isFiltering ? undefined : (a, b) => void swap(a, b)}
          />
        )}
      </Card>

      <TopicEditor state={editor} onClose={() => setEditor(null)} />
    </div>
  );
}
