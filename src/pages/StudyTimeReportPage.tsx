import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarCheck2, ChevronLeft, ChevronRight, Clock, Gauge, Settings2, Trophy } from "lucide-react";
import { Button, Card, CardHeader, DateInput, EmptyState, IconButton, Input, PageHeader, SegmentedControl, Select, StatCard } from "../components/ui";
import { todayISO } from "../lib/date";
import { formatMinutes } from "../lib/duration";
import { datesInRange, periodLabel, periodRange, shiftPeriod, type PeriodKind } from "../lib/studyCalendar";
import { useEntryNames, useLogEntries } from "../features/log/hooks/useLog";
import { BarList } from "../features/reports/components/BarList";
import { TimeBars, type TimeBar } from "../features/reports/components/TimeBars";
import { RatingBadge, TargetMeter } from "../features/targets/components/TargetMeter";
import { TargetsModal } from "../features/targets/components/TargetsModal";
import { useSettings } from "../features/targets/hooks/useSettings";
import { dailyTarget, minutesByDate, periodTarget, summarize, sumRange, weeklyTarget, weeksIn } from "../features/targets/studyTime";

const KINDS: { value: PeriodKind; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export function StudyTimeReportPage() {
  const { entries, isLoading } = useLogEntries();
  const names = useEntryNames();
  const { settings, writable } = useSettings();
  const today = todayISO();
  const [kind, setKind] = useState<PeriodKind>("week");
  const [anchor, setAnchor] = useState(today);
  const [editTargets, setEditTargets] = useState(false);

  const byDate = useMemo(() => minutesByDate(entries), [entries]);
  const range = useMemo(() => periodRange(kind, anchor), [kind, anchor]);
  const summary = useMemo(() => summarize(byDate, kind, anchor, today), [byDate, kind, anchor, today]);
  const target = periodTarget(kind, range, settings, today);
  const isCurrent = range.from <= today && today <= range.to;
  const isFuture = range.from > today;

  /* -------------------------------------------------------------- chart */
  const chart = useMemo((): { bars: TimeBar[]; target: number | null; title: string; labelEvery: number } | null => {
    const daily = dailyTarget(settings) || null;
    if (kind === "week" || kind === "month") {
      const bars = datesInRange(range).map((d) => ({
        key: d,
        label: kind === "week" ? format(parseISO(d), "EEE") : format(parseISO(d), "d"),
        title: format(parseISO(d), "EEEE, d MMM"),
        minutes: byDate.get(d) ?? 0,
        muted: d > today,
        current: d === today,
      }));
      return { bars, target: daily, title: kind === "week" ? "Each day · Sat to Fri" : "Each day", labelEvery: kind === "month" ? 5 : 1 };
    }
    if (kind === "year") {
      const year = range.from.slice(0, 4);
      const bars = Array.from({ length: 12 }, (_, m) => {
        const monthAnchor = `${year}-${String(m + 1).padStart(2, "0")}-01`;
        const r = periodRange("month", monthAnchor);
        const s = summarize(byDate, "month", monthAnchor, today);
        return {
          key: monthAnchor,
          label: format(parseISO(monthAnchor), "MMM"),
          title: `${format(parseISO(monthAnchor), "MMMM yyyy")} · average per day`,
          minutes: s.avgPerDay,
          muted: r.from > today,
          current: r.from <= today && today <= r.to,
        };
      });
      return { bars, target: daily, title: "Average per day · each month", labelEvery: 1 };
    }
    return null;
  }, [kind, range, byDate, settings, today]);

  /* ---------------------------------------------------------- breakdown */
  const breakdown = useMemo(() => {
    const inRange = entries.filter((e) => e.minutes && e.date >= range.from && e.date <= range.to);
    const total = inRange.reduce((n, e) => n + (e.minutes ?? 0), 0);
    const bySubject = new Map<string, number>();
    let bcs = 0;
    let it = 0;
    for (const e of inRange) {
      const m = e.minutes ?? 0;
      if (e.category === "IT") it += m;
      else bcs += m;
      const n = names(e);
      const key = e.category === "IT" ? `IT · ${n.topic}` : n.subject;
      bySubject.set(key, (bySubject.get(key) ?? 0) + m);
    }
    const item = (key: string, label: string, m: number) => ({
      key,
      label,
      value: total ? Math.round((m / total) * 100) : 0,
      detail: formatMinutes(m),
    });
    return {
      total,
      inRange,
      split: [item("bcs", "BCS", bcs), item("it", "IT", it)],
      subjects: [...bySubject.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, m]) => item(k, k, m)),
    };
  }, [entries, range, names]);

  /* ------------------------------------------------------ week by week */
  const firstLogged = useMemo(() => entries.reduce((min, e) => (e.minutes && e.date < min ? e.date : min), today), [entries, today]);
  const weeks = useMemo(() => {
    const span =
      kind === "month" || kind === "year"
        ? range
        : { from: shiftPeriod("week", range.from, -7), to: periodRange("week", anchor).to }; // last 8 weeks
    return weeksIn(span)
      // Only weeks since you started logging — earlier weeks would all read "0%".
      .filter((w) => w.from <= today && w.to >= firstLogged)
      .map((w) => {
        const total = sumRange(byDate, w);
        const t = periodTarget("week", w, settings, today);
        const s = summarize(byDate, "week", w.from, today);
        const current = w.from <= today && today <= w.to;
        return { range: w, total, avg: s.avgPerDay, target: t, current };
      });
  }, [kind, range, anchor, byDate, settings, today, firstLogged]);

  const years = useMemo(() => {
    const first = entries.reduce((min, e) => (e.date < min ? e.date : min), today).slice(0, 4);
    const out: string[] = [];
    for (let y = Number(today.slice(0, 4)); y >= Number(first); y--) out.push(String(y));
    return out;
  }, [entries, today]);

  const hasTargets = weeklyTarget(settings) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study time"
        description="How much you studied, against your targets. Weeks run Saturday to Friday."
        actions={
          <Button variant="secondary" icon={<Settings2 className="size-4" />} onClick={() => setEditTargets(true)} disabled={!writable}>
            Targets
          </Button>
        }
      />

      {/* Period controls */}
      <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <SegmentedControl<PeriodKind>
          ariaLabel="Period"
          value={kind}
          onChange={(k) => {
            setKind(k);
            setAnchor(today);
          }}
          segments={KINDS}
        />
        <div className="flex items-center gap-2">
          <IconButton label="Previous" icon={<ChevronLeft />} onClick={() => setAnchor(shiftPeriod(kind, anchor, -1))} />
          {kind === "month" ? (
            <div className="w-44">
              <Input type="month" value={anchor.slice(0, 7)} max={today.slice(0, 7)} onChange={(e) => e.target.value && setAnchor(`${e.target.value}-01`)} aria-label="Month" />
            </div>
          ) : kind === "year" ? (
            <div className="w-28">
              <Select value={anchor.slice(0, 4)} onChange={(e) => setAnchor(`${e.target.value}-01-01`)} options={years.map((y) => ({ value: y, label: y }))} aria-label="Year" />
            </div>
          ) : (
            <div className="w-44">
              <DateInput value={anchor} max={today} onChange={(e) => e.target.value && setAnchor(e.target.value)} aria-label={kind === "week" ? "Any day in the week" : "Day"} />
            </div>
          )}
          <IconButton label="Next" icon={<ChevronRight />} onClick={() => setAnchor(shiftPeriod(kind, anchor, 1))} disabled={periodRange(kind, shiftPeriod(kind, anchor, 1)).from > today} />
          {!isCurrent && (
            <Button variant="ghost" size="sm" onClick={() => setAnchor(today)}>
              Today
            </Button>
          )}
        </div>
      </Card>

      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-fg">{periodLabel(kind, anchor)}</h2>
        {isCurrent && kind !== "day" && <p className="text-xs text-fg-subtle">In progress · {summary.elapsedDays} of {datesInRange(range).length} days so far</p>}
      </div>

      {isLoading ? null : isFuture ? (
        <Card>
          <EmptyState icon={<CalendarCheck2 />} title="This period hasn't started yet" />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total" icon={<Clock />} value={formatMinutes(summary.total)} hint={`${breakdown.inRange.length} log entries`} />
            <StatCard
              label="Avg per day"
              icon={<Gauge />}
              value={formatMinutes(summary.avgPerDay)}
              hint={kind === "day" ? "—" : `over ${summary.elapsedDays} ${summary.elapsedDays === 1 ? "day" : "days"}`}
            />
            <StatCard
              label="Days studied"
              icon={<CalendarCheck2 />}
              value={`${summary.studiedDays} / ${summary.elapsedDays}`}
              hint={summary.elapsedDays ? `${Math.round((summary.studiedDays / summary.elapsedDays) * 100)}% of days` : undefined}
            />
            <StatCard
              label="Best day"
              icon={<Trophy />}
              value={summary.best ? formatMinutes(summary.best.minutes) : "—"}
              hint={summary.best ? format(parseISO(summary.best.date), "EEE, d MMM") : "Nothing logged"}
            />
          </div>

          <Card className="p-4 sm:p-5">
            <TargetMeter
              label={kind === "day" ? "Daily target" : kind === "week" ? "Weekly target" : "Target · daily target × days"}
              actual={summary.total}
              target={target?.full ?? null}
              targetToDate={target?.toDate}
            />
            {!target && (
              <p className="mt-2 text-xs text-fg-subtle">
                No target set.{" "}
                {writable && (
                  <button type="button" className="cursor-pointer font-semibold text-primary hover:underline" onClick={() => setEditTargets(true)}>
                    Set targets
                  </button>
                )}
              </p>
            )}
          </Card>

          {chart && (
            <Card>
              <CardHeader title={chart.title} description={chart.target ? "Dashed line = daily target. Hover a bar for details." : "Hover a bar for details."} />
              <div className="px-4 pt-8 pb-4 sm:px-5">
                <TimeBars bars={chart.bars} target={chart.target} targetLabel="Daily" labelEvery={chart.labelEvery} />
              </div>
            </Card>
          )}

          {kind === "day" && (
            <Card>
              <CardHeader title="Sessions" />
              {breakdown.inRange.length === 0 ? (
                <EmptyState icon={<Clock />} title="Nothing logged this day" />
              ) : (
                <ul className="divide-y divide-border">
                  {breakdown.inRange.map((e) => {
                    const n = names(e);
                    return (
                      <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
                        <span className="min-w-0 truncate text-fg">
                          {e.category === "BCS" ? `${n.subject} › ` : "IT › "}
                          <span className="font-semibold">{n.topic}</span>
                        </span>
                        <span className="font-numbers text-fg-muted">{formatMinutes(e.minutes ?? 0)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          )}

          {breakdown.total > 0 && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader title="BCS vs IT" />
                <div className="p-4 sm:p-5">
                  <BarList items={breakdown.split} />
                </div>
              </Card>
              <Card>
                <CardHeader title="By subject" description="Top subjects / IT topics this period" />
                <div className="p-4 sm:p-5">
                  <BarList items={breakdown.subjects} />
                </div>
              </Card>
            </div>
          )}

          {kind !== "day" && (
            <Card>
              <CardHeader
                title="Week by week"
                description={hasTargets ? `Weekly target ${formatMinutes(weeklyTarget(settings))} · rated against your current target` : "Set a weekly target to rate each week"}
              />
              {weeks.length === 0 ? (
                <EmptyState icon={<CalendarCheck2 />} title="No weeks yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-fg-subtle">
                        <th className="px-4 py-2.5 font-semibold sm:px-5">Week (Sat – Fri)</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                        <th className="px-3 py-2.5 text-right font-semibold">Avg / day</th>
                        <th className="px-4 py-2.5 text-right font-semibold sm:px-5">vs target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {weeks.map((w) => (
                        <tr key={w.range.from} className={w.current ? "bg-primary-soft/40" : undefined}>
                          <td className="px-4 py-2.5 text-fg sm:px-5">
                            <button
                              type="button"
                              className="cursor-pointer text-left hover:text-primary hover:underline"
                              onClick={() => {
                                setKind("week");
                                setAnchor(w.range.from);
                              }}
                            >
                              {format(parseISO(w.range.from), "d MMM")} – {format(parseISO(w.range.to), "d MMM")}
                            </button>
                            {w.current && <span className="ml-2 text-xs text-fg-subtle">this week</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right font-numbers text-fg">{formatMinutes(w.total)}</td>
                          <td className="px-3 py-2.5 text-right font-numbers text-fg-muted">{formatMinutes(w.avg)}</td>
                          <td className="px-4 py-2.5 text-right sm:px-5">
                            {w.target ? <RatingBadge actual={w.total} target={w.current ? w.target.toDate : w.target.full} pace={w.current} /> : <span className="text-xs text-fg-subtle">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {editTargets && <TargetsModal onClose={() => setEditTargets(false)} />}
    </div>
  );
}
