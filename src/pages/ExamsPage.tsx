import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck2, ClipboardList, Plus, SearchX, Send, Timer } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  DateField,
  EmptyState,
  ErrorState,
  ListSkeleton,
  PageHeader,
  SegmentedControl,
  StatCard,
  StatCardsSkeleton,
} from "../components/ui";
import { useExams } from "../features/exams/hooks/useExams";
import { ExamCard } from "../features/exams/components/ExamCard";
import { ExamFormModal } from "../features/exams/components/ExamFormModal";
import { daysLabel, examState, inRange, WINDOW_OPTIONS, windowRange, type ExamDateField, type ExamWindow } from "../features/exams/examLogic";
import type { Exam, ExamType } from "../types";

interface Filters {
  type: "ALL" | ExamType;
  window: ExamWindow;
  field: ExamDateField;
  from: string;
  to: string;
  showDone: boolean;
}
const DEFAULT_FILTERS: Filters = { type: "ALL", window: "ALL", field: "EXAM", from: "", to: "", showDone: false };
const STORE_KEY = "exam-filters";

function loadFilters(): Filters {
  try {
    return { ...DEFAULT_FILTERS, ...(JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}") as Partial<Filters>) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function ExamsPage() {
  const { exams, isLoading, isFetching, refetch, error, writable, save, remove, setHidden } = useExams();
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const [editing, setEditing] = useState<Exam | "new" | null>(null);
  const [deleting, setDeleting] = useState<Exam | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(filters));
    } catch {
      /* ignore */
    }
  }, [filters]);
  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));

  const stats = useMemo(() => {
    const states = exams.map((e) => ({ e, st: examState(e) }));
    const open = states.filter((x) => x.st.phase === "APPLY_OPEN");
    const closingSoon = open.filter((x) => (x.st.applyIn ?? 99) <= 7).length;
    const applied = states.filter((x) => x.e.applied && x.st.phase !== "DONE").length;
    const next = states
      .filter((x) => x.st.phase !== "DONE" && x.e.examDate)
      .sort((a, b) => a.e.examDate.localeCompare(b.e.examDate))[0];
    return { open: open.length, closingSoon, applied, next };
  }, [exams]);

  const visible = useMemo(() => {
    const range = windowRange(filters.window, { from: filters.from, to: filters.to });
    return exams.filter((e) => {
      if (filters.type !== "ALL" && e.type !== filters.type) return false;
      if (!filters.showDone && examState(e).phase === "DONE") return false;
      return inRange(filters.field === "EXAM" ? e.examDate : e.applyDeadline, range);
    });
  }, [exams, filters]);
  const doneCount = useMemo(() => exams.filter((e) => examState(e).phase === "DONE").length, [exams]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        description="Circulars, deadlines and exam days, most important first."
        actions={
          <Button icon={<Plus className="size-4" />} disabled={!writable} onClick={() => setEditing("new")}>
            Add exam
          </Button>
        }
      />

      {!isLoading && !writable && (
        <Card className="flex items-start gap-3 border-warning/30 bg-warning-soft p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">The exam tracker needs the latest Code.gs (v6).</span> Copy everything in{" "}
            <code className="font-mono text-xs">Code.gs</code>, paste it over the code in Extensions → Apps Script, then Deploy → Manage deployments → edit →
            Version: <em>New version</em> → Deploy. Your existing tabs aren't touched; an “Exams” tab is created on the first save.
          </p>
        </Card>
      )}

      {isLoading ? (
        <StatCardsSkeleton label="Loading exams" />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Open to apply" icon={<Send />} tone={stats.open > 0 ? "warning" : "neutral"} value={stats.open} hint="Deadline not passed, not applied" />
          <StatCard
            label="Closing in 7 days"
            icon={<Timer />}
            tone={stats.closingSoon > 0 ? "danger" : "success"}
            value={stats.closingSoon}
            hint={stats.closingSoon > 0 ? "Apply soon" : "Nothing urgent"}
          />
          <StatCard label="Applied" icon={<CalendarCheck2 />} tone="success" value={stats.applied} hint="Waiting for the exam" />
          <StatCard
            label="Next exam"
            icon={<ClipboardList />}
            tone="info"
            value={stats.next ? daysLabel(examState(stats.next.e).examIn ?? 0).replace(/^in /, "") : "—"}
            hint={stats.next ? stats.next.e.title : "No dates yet"}
          />
        </div>
      )}

      {/* Filters */}
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<Filters["type"]>
            ariaLabel="Type"
            value={filters.type}
            onChange={(type) => patch({ type })}
            segments={[
              { value: "ALL", label: "All" },
              { value: "IT", label: "IT" },
              { value: "GENERAL", label: "General" },
            ]}
          />
          <SegmentedControl<ExamDateField>
            ariaLabel="Filter dates by"
            value={filters.field}
            onChange={(field) => patch({ field })}
            segments={[
              { value: "EXAM", label: "Exam date" },
              { value: "DEADLINE", label: "Apply deadline" },
            ]}
          />
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-semibold text-fg-subtle">
            <input type="checkbox" checked={filters.showDone} onChange={(e) => patch({ showDone: e.target.checked })} className="size-4 accent-(--c-primary)" />
            Show finished ({doneCount})
          </label>
        </div>
        <SegmentedControl<ExamWindow> ariaLabel="Date window" value={filters.window} onChange={(window) => patch({ window })} segments={WINDOW_OPTIONS} />
        {filters.window === "CUSTOM" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateField ariaLabel="From" value={filters.from} onChange={(from) => patch({ from })} placeholder="From" />
            <DateField ariaLabel="To" value={filters.to} onChange={(to) => patch({ to })} placeholder="To" />
          </div>
        )}
      </Card>

      {isLoading ? (
        <Card>
          <ListSkeleton rows={4} label="Loading exams" />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState title="Couldn't load your exams" message={error} onRetry={refetch} retrying={isFetching} />
        </Card>
      ) : exams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList />}
            title="No exams yet"
            description="Add a circular to track its deadline, exam day, centre and links."
            action={
              writable && (
                <Button icon={<Plus className="size-4" />} onClick={() => setEditing("new")}>
                  Add exam
                </Button>
              )
            }
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchX />}
            title="No exams match these filters"
            action={
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_FILTERS)}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((e) => (
            <ExamCard
              key={e.id}
              exam={e}
              writable={writable}
              onEdit={() => setEditing(e)}
              onDelete={() => setDeleting(e)}
              onToggleApplied={() => void save({ ...e, applied: !e.applied }, false, e.applied ? undefined : `Marked “${e.title}” as applied`)}
              onToggleHidden={() => void setHidden(e, !e.hideOnDashboard)}
            />
          ))}
        </div>
      )}

      <ExamFormModal
        exam={editing}
        onClose={() => setEditing(null)}
        onSave={(exam, isNew) => save(exam, isNew, isNew ? `Added “${exam.title}”` : "Saved")}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete exam?"
        message={
          <>
            <span className="font-semibold text-fg">{deleting?.title}</span> and everything saved with it (links, login, notes) will be removed from the sheet.
          </>
        }
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          const ok = await remove(deleting);
          setBusy(false);
          if (ok) setDeleting(null);
        }}
      />
    </div>
  );
}
