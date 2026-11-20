import { InfoPopover } from "../../../components/ui";
import { formatMinutes } from "../../../lib/duration";
import type { StudySettings } from "../../../types";
import { weekPlan } from "../studyTime";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** ⓘ next to "on pace": what it takes to still hit this week's (Sat–Fri) target. */
export function WeekPlanInfo({ byDate, settings, today }: { readonly byDate: ReadonlyMap<string, number>; readonly settings: StudySettings; readonly today: string }) {
  const p = weekPlan(byDate, settings, today);
  if (!p) return null;
  const f = formatMinutes;

  const leftParts = [p.weekdaysLeft && plural(p.weekdaysLeft, "weekday", "weekdays"), p.weekendLeft && plural(p.weekendLeft, "weekend day", "weekend days")].filter(Boolean);

  return (
    <InfoPopover label="How to hit this week's target">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">This week · Sat – Fri</p>

      <p className="mt-2 text-fg">
        Target <span className="font-numbers">{f(p.weekly)}</span>
        {p.makeup && (
          <span className="text-fg-muted">
            {" "}
            = {f(p.makeup.weekday)} × 5 weekdays + {f(p.makeup.weekend)} × 2 weekend days
          </span>
        )}
      </p>
      <p className="mt-1 text-fg-muted">
        Done <span className="font-numbers text-fg">{f(p.done)}</span>
        {p.daysPassed > 0 && <> in {plural(p.daysPassed, "day", "days")}</>}.
      </p>

      <div className="mt-3 border-t border-border pt-3">
        {p.need === 0 ? (
          <p className="font-semibold text-success">Weekly target already met. Anything more is a bonus.</p>
        ) : p.daysLeft === 1 ? (
          <p className="text-fg">
            <span className="font-semibold">Today is the last day</span> — you need{" "}
            <span className="font-numbers font-semibold text-danger">{f(p.need)}</span> more to hit the week.
          </p>
        ) : (
          <div className="space-y-2.5">
            <p className="text-fg-muted">
              <span className="font-numbers font-semibold text-fg">{f(p.need)}</span> left over {plural(p.daysLeft, "day", "days")} (today included
              {leftParts.length ? `: ${leftParts.join(" + ")}` : ""}).
            </p>
            {p.keepWeekend && (
              <p className="rounded-xl bg-primary-soft px-3 py-2 text-fg">
                Keep <span className="font-numbers">{f(p.keepWeekend.weekendPerDay)}</span> on the weekend {p.weekendLeft === 1 ? "day" : "days"} →{" "}
                <span className="font-numbers font-semibold text-primary">{f(p.keepWeekend.weekdayPerDay)}</span> each weekday
                {p.keepWeekend.weekdayPerDay === 0 && " (the weekend covers it)"}.
              </p>
            )}
            <p className="text-fg">
              {p.keepWeekend ? "Or spread it evenly:" : "Spread evenly:"}{" "}
              <span className="font-numbers font-semibold">{f(p.evenPerDay)}</span> a day.
            </p>
            {p.weekendLeft > 0 && p.weekdaysLeft === 0 && (
              <p className="text-fg-muted">Only weekend left — {f(p.evenPerDay)} on each weekend day.</p>
            )}
          </div>
        )}
      </div>

      {!settings.weekendTargetMinutes && settings.dailyTargetMinutes > 0 && (
        <p className="mt-3 text-xs text-fg-subtle">Tip: set a weekend target in Targets to plan weekdays and weekends separately.</p>
      )}
    </InfoPopover>
  );
}
