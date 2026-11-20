import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowRight, EyeOff } from "lucide-react";
import { Card, CardHeader, IconButton, TONE_DOT, TONE_TEXT } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { daysLabel, examState, PRIORITY_META, urgencyTone } from "../examLogic";
import { useExams } from "../hooks/useExams";

const day = (iso: string) => format(parseISO(iso), "d MMM");

/** Dashboard: the next few exams that need attention. Each can be hidden from here. */
export function UpcomingExamsCard() {
  const { exams, writable, setHidden } = useExams();
  const shown = exams.filter((e) => !e.hideOnDashboard && examState(e).phase !== "DONE").slice(0, 5);
  const hiddenCount = exams.filter((e) => e.hideOnDashboard && examState(e).phase !== "DONE").length;
  if (shown.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Upcoming exams"
        description={hiddenCount > 0 ? `${hiddenCount} hidden from the dashboard` : "Most important first"}
        actions={
          <Link to="/exams" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            All exams <ArrowRight className="size-3.5" />
          </Link>
        }
      />
      <ul className="divide-y divide-border">
        {shown.map((e) => {
          const st = examState(e);
          let line: { text: string; tone: string };
          if (st.phase === "APPLY_OPEN") line = { text: `Apply by ${day(e.applyDeadline)} · ${daysLabel(st.applyIn ?? 0)}`, tone: TONE_TEXT[urgencyTone(st.applyIn)] };
          else if (st.phase === "APPLY_MISSED") line = { text: `Application closed ${day(e.applyDeadline)}`, tone: "text-fg-subtle" };
          else if (e.examDate)
            line = {
              text: `${e.applied ? "Applied · " : ""}Exam ${e.examDateEstimated ? "~" : ""}${day(e.examDate)} · ${daysLabel(st.examIn ?? 0)}`,
              tone: e.applied ? "text-success" : TONE_TEXT[urgencyTone(st.examIn)],
            };
          else line = { text: e.applied ? "Applied · exam date not announced" : "Exam date not announced", tone: e.applied ? "text-success" : "text-fg-subtle" };
          return (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[PRIORITY_META[e.priority].tone])} title={`${PRIORITY_META[e.priority].label} priority`} />
              <Link to="/exams" className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{e.title}</p>
                <p className={cn("truncate text-xs", line.tone)}>{line.text}</p>
              </Link>
              {writable && <IconButton label="Hide from dashboard" icon={<EyeOff />} size="sm" onClick={() => void setHidden(e, true)} />}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
