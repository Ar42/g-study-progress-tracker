import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, NotebookPen, Play, Settings2 } from "lucide-react";
import { Button, Card, IconButton } from "../../../components/ui";
import { todayISO } from "../../../lib/date";
import { formatMinutes } from "../../../lib/duration";
import { elapsedMs, splitByLocalDay } from "../../../lib/sessionTime";
import { periodRange } from "../../../lib/studyCalendar";
import { useLogEntries } from "../../log/hooks/useLog";
import { useActiveSession, useStartTimer } from "../../timer/hooks/useActiveSession";
import { useNow } from "../../timer/hooks/useNow";
import { useSettings } from "../hooks/useSettings";
import { minutesByDate, periodTarget, sumRange } from "../studyTime";
import { TargetMeter } from "./TargetMeter";
import { TargetsModal } from "./TargetsModal";

/** Dashboard card: today and this week (Sat–Fri) against your targets, plus quick start. */
export function StudyTimeCard() {
  const { entries } = useLogEntries();
  const { settings, writable } = useSettings();
  const { session, running } = useActiveSession();
  const startTimer = useStartTimer();
  const now = useNow(running, 30_000);
  const [editTargets, setEditTargets] = useState(false);

  const today = todayISO();
  const byDate = useMemo(() => minutesByDate(entries), [entries]);
  const week = periodRange("week", today);
  const todayLogged = byDate.get(today) ?? 0;
  const weekLogged = sumRange(byDate, week);

  // Time on the clock right now counts towards today (it's logged when you finish).
  const liveToday = session ? (splitByLocalDay(session.segments, now).find((s) => s.date === today)?.minutes ?? 0) : 0;
  const liveTotal = session ? elapsedMs(session.segments, now) / 60000 : 0;
  const liveWeek = session ? splitByLocalDay(session.segments, now).filter((s) => s.date >= week.from).reduce((n, s) => n + s.minutes, 0) : 0;

  const dayT = periodTarget("day", periodRange("day", today), settings, today);
  const weekT = periodTarget("week", week, settings, today);
  const noTargets = !dayT && !weekT;

  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base font-semibold text-fg">Study time</h2>
        <div className="flex items-center gap-1">
          <IconButton label="Set study targets" icon={<Settings2 />} onClick={() => setEditTargets(true)} disabled={!writable} />
          <Link to="/reports/time" className="inline-flex size-9 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-3 hover:text-fg" title="Study time report">
            <BarChart3 className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TargetMeter
          label="Today"
          actual={todayLogged + liveToday}
          target={dayT?.full ?? null}
          extra={liveToday > 0 ? `incl. ${formatMinutes(liveToday)} on the clock` : undefined}
        />
        <TargetMeter
          label="This week · Sat–Fri"
          actual={weekLogged + liveWeek}
          target={weekT?.full ?? null}
          targetToDate={weekT?.toDate}
        />
      </div>

      {noTargets && (
        <p className="mt-4 text-xs text-fg-subtle">
          Set a daily or weekly target to see how you're doing.{" "}
          {writable && (
            <button type="button" className="cursor-pointer font-semibold text-primary hover:underline" onClick={() => setEditTargets(true)}>
              Set targets
            </button>
          )}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        {session ? (
          <Link to="/log" className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-fg hover:bg-primary-hover">
            <Play className="size-4" />
            {running ? "Timer running" : "Timer paused"} · {formatMinutes(liveTotal)}
          </Link>
        ) : (
          <Button size="sm" icon={<Play className="size-3.5" />} onClick={() => startTimer()}>
            Start timer
          </Button>
        )}
        <Link
          to="/log?new=1"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-fg hover:bg-surface-2"
        >
          <NotebookPen className="size-3.5" />
          Log manually
        </Link>
      </div>

      {editTargets && <TargetsModal onClose={() => setEditTargets(false)} />}
    </Card>
  );
}
