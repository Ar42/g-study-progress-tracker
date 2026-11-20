import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, IconButton, Input, Markdown, TONE_TEXT } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { decryptText, getPassphrase, isEncrypted, setPassphrase } from "../../../lib/secretBox";
import type { Exam } from "../../../types";
import { daysLabel, examState, formatMoney, mapHref, PRIORITY_META, urgencyTone } from "../examLogic";
import { parseCredentials, type ExamCredentials } from "../credentials";

const fmt = (iso: string) => format(parseISO(iso), "EEE, d MMM yyyy");
const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h)) return hhmm;
  return format(new Date(2000, 0, 1, h, m || 0), "h:mm a");
};

/** Left edge colour = priority, so the list scans at a glance. */
const EDGE = { HIGH: "border-l-danger", MEDIUM: "border-l-warning", LOW: "border-l-border-strong" } as const;

export interface ExamCardProps {
  readonly exam: Exam;
  readonly writable: boolean;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
  readonly onToggleApplied: () => void;
  readonly onToggleHidden: () => void;
}

export function ExamCard({ exam, writable, onEdit, onDelete, onToggleApplied, onToggleHidden }: ExamCardProps) {
  const [open, setOpen] = useState(false);
  const st = examState(exam);
  const done = st.phase === "DONE";
  const pr = PRIORITY_META[exam.priority];
  const hasDetails = Boolean(
    exam.description || exam.links.length || exam.centreNotes || exam.credentials || exam.circularDate || exam.salaryGross,
  );

  return (
    <Card className={cn("overflow-hidden border-l-4", EDGE[exam.priority], done && "opacity-70")}>
      <div className="space-y-3 p-4 sm:p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={pr.tone} dot>
                {pr.label}
              </Badge>
              <Badge tone={exam.type === "IT" ? "primary" : "neutral"}>{exam.type === "IT" ? "IT" : "General"}</Badge>
              {exam.grade && <Badge tone="neutral">{exam.grade}</Badge>}
              {exam.hideOnDashboard && (
                <Badge tone="neutral" icon={<EyeOff className="size-3" />}>
                  Hidden on dashboard
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold text-fg">{exam.title}</h3>
            {exam.organization && <p className="text-sm text-fg-muted">{exam.organization}</p>}
          </div>
          {writable && (
            <div className="flex shrink-0 items-center">
              <IconButton
                label={exam.hideOnDashboard ? "Show on dashboard" : "Hide from dashboard"}
                icon={exam.hideOnDashboard ? <Eye /> : <EyeOff />}
                size="sm"
                onClick={onToggleHidden}
              />
              <IconButton label="Edit exam" icon={<Pencil />} size="sm" onClick={onEdit} />
              <IconButton label="Delete exam" icon={<Trash2 />} size="sm" tone="danger" onClick={onDelete} />
            </div>
          )}
        </div>

        {/* Status strip */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ApplyStatus exam={exam} st={st} writable={writable} onToggleApplied={onToggleApplied} />
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
            <CalendarClock className={cn("size-4 shrink-0", done ? "text-fg-subtle" : TONE_TEXT[urgencyTone(st.examIn)])} />
            <div className="min-w-0 text-sm">
              {exam.examDate ? (
                <>
                  <p className="font-medium text-fg">
                    {exam.examDateEstimated && <span title="Estimated date">~ </span>}
                    {fmt(exam.examDate)}
                    {exam.examTime && <span className="text-fg-muted"> · {fmtTime(exam.examTime)}</span>}
                  </p>
                  <p className={cn("text-xs", done ? "text-fg-subtle" : TONE_TEXT[urgencyTone(st.examIn)])}>
                    {done ? "Exam is over" : `Exam ${daysLabel(st.examIn ?? 0)}`}
                    {exam.examDateEstimated && <span className="text-fg-subtle"> · estimated</span>}
                  </p>
                </>
              ) : (
                <p className="text-fg-subtle">Exam date not announced</p>
              )}
            </div>
          </div>
        </div>

        {/* Facts */}
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-fg-muted">
          {exam.salaryMonthly && (
            <li>
              <span className="font-numbers font-medium text-fg">{formatMoney(exam.salaryMonthly)}</span>/month
            </li>
          )}
          {exam.totalSeats && (
            <li className="flex items-center gap-1.5">
              <Users className="size-3.5 text-fg-subtle" />
              <span className="font-numbers font-medium text-fg">{exam.totalSeats}</span> seats
              {!exam.seatsConfirmed && <span className="text-xs text-warning">(possible)</span>}
            </li>
          )}
          {exam.centreName && (
            <li>
              <a
                href={mapHref(exam)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
              >
                <MapPin className="size-3.5" /> {exam.centreName}
              </a>
            </li>
          )}
          {exam.website && (
            <li>
              <a href={exam.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline">
                <Globe className="size-3.5" /> Official site
              </a>
            </li>
          )}
        </ul>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-fg-subtle hover:text-fg"
          >
            <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
            {open ? "Less" : "More details"}
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-4 border-t border-border bg-surface-2/30 p-4 text-sm sm:p-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {exam.circularDate && <Fact label="Circular published">{fmt(exam.circularDate)}</Fact>}
            {exam.salaryGross && <Fact label="Gross salary">{formatMoney(exam.salaryGross)}</Fact>}
            {exam.centreNotes && <Fact label="Getting there" wide>{exam.centreNotes}</Fact>}
          </dl>
          {exam.links.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Links</p>
              <ul className="space-y-1">
                {exam.links.map((l, i) => (
                  <li key={i}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline">
                      <ExternalLink className="size-3.5" /> {l.title || l.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {exam.credentials && <CredentialsView stored={exam.credentials} />}
          {exam.description && <Markdown source={exam.description} />}
        </div>
      )}
    </Card>
  );
}

function Fact({ label, wide, children }: { readonly label: string; readonly wide?: boolean; readonly children: React.ReactNode }) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="text-fg">{children}</dd>
    </div>
  );
}

function ApplyStatus({
  exam,
  st,
  writable,
  onToggleApplied,
}: {
  readonly exam: Exam;
  readonly st: ReturnType<typeof examState>;
  readonly writable: boolean;
  readonly onToggleApplied: () => void;
}) {
  if (exam.applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-success/25 bg-success-soft px-3 py-2">
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" /> Applied
        </p>
        {writable && st.phase !== "DONE" && (
          <button type="button" onClick={onToggleApplied} className="cursor-pointer text-xs text-fg-subtle hover:text-fg">
            Undo
          </button>
        )}
      </div>
    );
  }
  if (st.phase === "APPLY_OPEN") {
    const tone = urgencyTone(st.applyIn);
    return (
      <div className={cn("flex items-center justify-between gap-2 rounded-lg border px-3 py-2", tone === "danger" ? "border-danger/30 bg-danger-soft" : tone === "warning" ? "border-warning/30 bg-warning-soft" : "border-info/25 bg-info-soft")}>
        <div className="text-sm">
          <p className="font-medium text-fg">Apply by {fmt(exam.applyDeadline)}</p>
          <p className={cn("text-xs font-semibold", TONE_TEXT[tone])}>Closes {daysLabel(st.applyIn ?? 0)}</p>
        </div>
        {writable && (
          <Button size="sm" variant="secondary" onClick={onToggleApplied}>
            Mark applied
          </Button>
        )}
      </div>
    );
  }
  if (st.phase === "APPLY_MISSED") {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
        <div className="text-sm">
          <p className="font-medium text-fg-muted">Application closed {fmt(exam.applyDeadline)}</p>
          <p className="text-xs text-danger">Not marked as applied</p>
        </div>
        {writable && (
          <Button size="sm" variant="ghost" onClick={onToggleApplied}>
            I applied
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center rounded-lg border border-border bg-surface-2/50 px-3 py-2 text-sm text-fg-subtle">
      {exam.applyDeadline ? `Applications closed ${fmt(exam.applyDeadline)}` : "No application deadline set"}
    </div>
  );
}

function CredentialsView({ stored }: { readonly stored: string }) {
  const [creds, setCreds] = useState<ExamCredentials | null>(null);
  const [asking, setAsking] = useState(false);
  const [pass, setPass] = useState("");
  const [error, setError] = useState<string>();

  const reveal = async (phrase = getPassphrase()) => {
    if (!isEncrypted(stored)) return setCreds(parseCredentials(stored));
    if (!phrase) return setAsking(true);
    try {
      const plain = await decryptText(stored, phrase);
      setPassphrase(phrase);
      setCreds(parseCredentials(plain));
      setAsking(false);
      setError(undefined);
    } catch {
      setAsking(true);
      setError("Wrong passphrase");
    }
  };

  const copy = (v: string, what: string) =>
    navigator.clipboard.writeText(v).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Couldn't copy"),
    );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">My login</p>
      {creds ? (
        <div className="space-y-1.5 rounded-lg border border-border bg-surface p-3">
          {(
            [
              ["User ID", creds.username],
              ["Password", creds.password],
              ["Other", creds.other],
            ] as const
          )
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-2">
                <span className="text-xs text-fg-subtle">{k}</span>
                <span className="flex min-w-0 items-center gap-1">
                  <code className="truncate font-mono text-sm text-fg">{v}</code>
                  <IconButton label={`Copy ${k}`} icon={<Copy />} size="sm" onClick={() => void copy(v, k)} />
                </span>
              </div>
            ))}
          <button type="button" onClick={() => setCreds(null)} className="cursor-pointer text-xs text-fg-subtle hover:text-fg">
            Hide
          </button>
        </div>
      ) : asking ? (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              type="password"
              aria-label="Passphrase"
              placeholder="Passphrase"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void reveal(pass)}
              leading={<KeyRound />}
            />
            <Button variant="secondary" onClick={() => void reveal(pass)} disabled={!pass}>
              Unlock
            </Button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      ) : (
        <Button variant="secondary" size="sm" icon={<KeyRound className="size-3.5" />} onClick={() => void reveal()}>
          Show login
        </Button>
      )}
    </div>
  );
}
