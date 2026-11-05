import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { StatCard } from "../../../components/ui";
import { daysUntil, formatDisplayDate, todayISO } from "../../../lib/date";
import { env } from "../../../config/env";
import { COUNTDOWN_LABEL } from "../../../config/constants";

/** Days left until the configured target date (VITE_TARGET_DATE). Ticks over at midnight. */
export function DeadlineCard() {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    const id = window.setInterval(() => setToday(todayISO()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const days = daysUntil(env.targetDate, today);
  const passed = days !== null && days < 0;

  return (
    <StatCard
      label={COUNTDOWN_LABEL}
      icon={<CalendarClock />}
      tone={passed ? "danger" : days !== null && days <= 14 ? "warning" : "primary"}
      value={days === null ? "—" : passed ? `${-days}d ago` : days === 0 ? "Today" : `${days} days`}
      hint={passed ? `Passed on ${formatDisplayDate(env.targetDate)}` : formatDisplayDate(env.targetDate)}
    />
  );
}
