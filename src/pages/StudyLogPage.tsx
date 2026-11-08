import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CalendarCheck2, Clock, Flame, Info, NotebookPen, Play, Plus, SearchX } from "lucide-react";
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, Spinner, StatCard } from "../components/ui";
import { REQUIRED_SCRIPT_VERSION, TIMER_SCRIPT_VERSION } from "../config/constants";
import { useActiveSession, useStartTimer } from "../features/timer/hooks/useActiveSession";
import { SessionControls } from "../features/timer/components/SessionControls";
import { todayISO } from "../lib/date";
import { useSyncStatus } from "../services/syncStatus";
import { useSubjects } from "../features/study/hooks/useStudyData";
import { useEntryNames, useLogActions, useLogEntries } from "../features/log/hooks/useLog";
import { LogEntryModal, type LogEditorState } from "../features/log/components/LogEntryModal";
import { LogEntryCard } from "../features/log/components/LogEntryCard";
import { LogFilters } from "../features/log/components/LogFilters";
import {
  DEFAULT_FILTER,
  buildSearchIndex,
  currentStreak,
  dayLabel,
  filterEntries,
  formatMinutes,
  groupByDay,
  totals,
  weekStart,
  type LogFilter,
} from "../features/log/logStats";
import type { LogEntry } from "../types";

/** Days of entries rendered per "Show older" click. */
const DAYS_PER_BATCH = 14;

export function StudyLogPage() {
  const { entries, isLoading, error } = useLogEntries();
  const { subjects } = useSubjects();
  const names = useEntryNames();
  const { remove } = useLogActions();
  const scriptVersion = useSyncStatus((s) => s.scriptVersion);
  const [params, setParams] = useSearchParams();

  const [filter, setFilter] = useState<LogFilter>(DEFAULT_FILTER);
  // "/log?new=1" (e.g. from the dashboard) opens the form straight away.
  const [editor, setEditor] = useState<LogEditorState | null>(() =>
    params.get("new") === "1" ? { mode: "create" } : null,
  );
  const [confirmDelete, setConfirmDelete] = useState<LogEntry | null>(null);

  // Drop "?new=1" from the URL so a reload doesn't reopen the form.
  useEffect(() => {
    if (params.has("new")) setParams({}, { replace: true });
  }, [params, setParams]);

  const today = todayISO();
  const needsScriptUpdate = !isLoading && (scriptVersion === null || scriptVersion < REQUIRED_SCRIPT_VERSION);
  const timerNeedsUpdate = !isLoading && !needsScriptUpdate && (scriptVersion ?? 0) < TIMER_SCRIPT_VERSION;
  const { session } = useActiveSession();
  const startTimer = useStartTimer();

  const summary = useMemo(() => {
    const t = totals(entries, today, today);
    const w = totals(entries, weekStart(today), today);
    return { today: t, week: w, streak: currentStreak(entries, today) };
  }, [entries, today]);

  // Typing stays responsive: the list re-filters at lower priority than the input.
  const deferredQuery = useDeferredValue(filter.query);
  // Resolve each entry's current subject/topic names once (stable objects keep cards memoised).
  const nameMap = useMemo(() => new Map(entries.map((e) => [e.id, names(e)])), [entries, names]);
  const searchIndex = useMemo(() => buildSearchIndex(entries, (e) => nameMap.get(e.id)!), [entries, nameMap]);
  const filtered = useMemo(
    () => filterEntries(entries, { ...filter, query: deferredQuery }, today, searchIndex),
    [entries, filter, deferredQuery, today, searchIndex],
  );
  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Render days in batches so "All time" with years of entries stays light.
  // Changing any filter starts again from the first batch.
  const filterKey = JSON.stringify(filter);
  const [paging, setPaging] = useState({ key: filterKey, days: DAYS_PER_BATCH });
  const shownDays = paging.key === filterKey ? paging.days : DAYS_PER_BATCH;
  const visibleGroups = groups.slice(0, shownDays);
  const hiddenEntries = groups.slice(shownDays).reduce((n, g) => n + g.entries.length, 0);

  const onEdit = useCallback((e: LogEntry) => setEditor({ mode: "edit", entry: e }), []);
  const onDelete = useCallback((e: LogEntry) => setConfirmDelete(e), []);

  const openCreate = () => setEditor({ mode: "create" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study log"
        description="A daily record of what you studied."
        actions={
          <>
            <Button variant="secondary" icon={<Plus className="size-4" />} onClick={openCreate} disabled={needsScriptUpdate}>
              Log manually
            </Button>
            {!session && (
              <Button icon={<Play className="size-4" />} onClick={() => startTimer()} disabled={needsScriptUpdate || timerNeedsUpdate}>
                Start timer
              </Button>
            )}
          </>
        }
      />

      {session && (
        <Card className="border-primary/30 p-5 sm:p-6">
          <SessionControls size="large" />
        </Card>
      )}

      {timerNeedsUpdate && (
        <Card className="flex items-start gap-3 border-primary/25 bg-primary-soft p-4">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">The study timer and targets need the latest Code.gs.</span> Paste it into Apps Script →
            Deploy → Manage deployments → edit → Version: <em>New version</em> → Deploy. Logging manually works already.
          </p>
        </Card>
      )}

      {needsScriptUpdate && (
        <Card className="flex items-start gap-3 border-warning/30 bg-warning-soft p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-fg">Update your Apps Script to start logging</p>
            <p className="text-fg-muted">
              The Study Log needs the latest <code className="font-mono text-xs">Code.gs</code>. Paste it into Extensions →
              Apps Script, then Deploy → Manage deployments → edit → Version: <em>New version</em> → Deploy. The URL stays the same.
            </p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Today"
          icon={<CalendarCheck2 />}
          tone={summary.today.entries > 0 ? "success" : "neutral"}
          value={summary.today.entries > 0 ? formatMinutes(summary.today.minutes) : "—"}
          hint={summary.today.entries > 0 ? `${summary.today.entries} ${summary.today.entries === 1 ? "entry" : "entries"}` : "Nothing logged yet"}
        />
        <StatCard
          label="This week"
          icon={<Clock />}
          value={formatMinutes(summary.week.minutes)}
          hint={`Sat–Fri · ${summary.week.entries} entries · ${summary.week.days} of 7 days`}
        />
        <StatCard
          label="Streak"
          icon={<Flame />}
          tone={summary.streak > 0 ? "warning" : "neutral"}
          value={`${summary.streak} ${summary.streak === 1 ? "day" : "days"}`}
          hint={summary.today.entries > 0 || summary.streak === 0 ? "Consecutive days logged" : "Log today to keep it going"}
        />
        <StatCard label="All time" icon={<NotebookPen />} value={entries.length} hint="Total entries" />
      </div>

      <LogFilters value={filter} onChange={setFilter} subjects={subjects} shown={filtered.length} total={entries.length} />

      {isLoading ? (
        <div className="flex justify-center py-16 text-primary">
          <Spinner />
        </div>
      ) : error ? (
        <Card>
          <EmptyState icon={<AlertTriangle />} title="Couldn't load the study log" description={error} />
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<NotebookPen />}
            title="No study logged yet"
            description="Log what you studied today. It takes a minute and builds a record you can look back on."
            action={
              <Button onClick={openCreate} disabled={needsScriptUpdate}>
                Log your first session
              </Button>
            }
          />
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <EmptyState icon={<SearchX />} title="No entries match these filters" description="Try a longer period or clear the filters." />
        </Card>
      ) : (
        <div className="space-y-6">
          {visibleGroups.map((g) => (
            <section key={g.date} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-3 px-1">
                <h2 className="text-sm font-semibold text-fg">{dayLabel(g.date, today)}</h2>
                <span className="text-xs text-fg-subtle">
                  {g.entries.length} {g.entries.length === 1 ? "entry" : "entries"}
                  {g.minutes > 0 && <> · <span className="font-numbers text-fg-muted">{formatMinutes(g.minutes)}</span></>}
                </span>
              </div>
              <div className="space-y-2.5">
                {g.entries.map((e) => (
                  <LogEntryCard
                    key={e.id}
                    entry={e}
                    names={nameMap.get(e.id)!}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          ))}
          {hiddenEntries > 0 && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setPaging({ key: filterKey, days: shownDays + DAYS_PER_BATCH })}
              >
                Show older ({hiddenEntries} more {hiddenEntries === 1 ? "entry" : "entries"})
              </Button>
            </div>
          )}
        </div>
      )}

      {editor && <LogEntryModal state={editor} onClose={() => setEditor(null)} />}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this log entry?"
        tone="danger"
        confirmLabel="Delete"
        message="It will be removed from the Study Log tab in your sheet."
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void remove(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
