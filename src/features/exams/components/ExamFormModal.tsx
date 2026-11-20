import { useEffect, useState, type ReactNode } from "react";
import { KeyRound, Lock, Plus, Trash2 } from "lucide-react";
import { Button, DateField, Field, IconButton, Input, MarkdownEditor, Modal, SegmentedControl, Textarea } from "../../../components/ui";
import { cn } from "../../../lib/cn";
import { generateRowId } from "../../../lib/id";
import { decryptText, encryptText, getPassphrase, isEncrypted, setPassphrase } from "../../../lib/secretBox";
import type { Exam, ExamLink, ExamPriority, ExamType } from "../../../types";
import { hasCreds, NO_CREDS, parseCredentials, type ExamCredentials } from "../credentials";

function blankExam(): Exam {
  const now = new Date().toISOString();
  return {
    id: generateRowId("exam"),
    title: "",
    organization: "",
    type: "GENERAL",
    priority: "MEDIUM",
    grade: "",
    salaryMonthly: "",
    salaryGross: "",
    totalSeats: "",
    seatsConfirmed: false,
    circularDate: "",
    website: "",
    links: [],
    applyDeadline: "",
    applied: false,
    examDate: "",
    examTime: "",
    examDateEstimated: false,
    centreName: "",
    centreMap: "",
    centreNotes: "",
    credentials: "",
    description: "",
    hideOnDashboard: false,
    createdAt: now,
    updatedAt: now,
  };
}

const PRIORITY_ACTIVE: Record<ExamPriority, string> = {
  HIGH: "[&>button[aria-selected=true]]:text-danger!",
  MEDIUM: "[&>button[aria-selected=true]]:text-warning!",
  LOW: "[&>button[aria-selected=true]]:text-fg!",
};

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{title}</h3>
      {children}
    </section>
  );
}

function Check({ checked, onChange, children }: { readonly checked: boolean; readonly onChange: (v: boolean) => void; readonly children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-(--c-primary)" />
      {children}
    </label>
  );
}

type CredState = "none" | "locked" | "open";

export interface ExamFormModalProps {
  /** null = closed, "new" = add, an Exam = edit. */
  readonly exam: Exam | "new" | null;
  readonly onClose: () => void;
  readonly onSave: (exam: Exam, isNew: boolean) => Promise<boolean>;
}

export function ExamFormModal({ exam, onClose, onSave }: ExamFormModalProps) {
  if (!exam) return null;
  return <ExamForm key={exam === "new" ? "new" : exam.id} initial={exam} onClose={onClose} onSave={onSave} />;
}

function ExamForm({ initial, onClose, onSave }: { readonly initial: Exam | "new" } & Omit<ExamFormModalProps, "exam">) {
  const isNew = initial === "new";
  const [form, setForm] = useState<Exam>(() => (initial === "new" ? blankExam() : initial));
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const stored = isNew ? "" : (initial as Exam).credentials;
  const plainStored = Boolean(stored) && !isEncrypted(stored);
  const [credState, setCredState] = useState<CredState>(() => (!stored ? "none" : plainStored ? "open" : "locked"));
  const [creds, setCreds] = useState<ExamCredentials>(() => (plainStored ? parseCredentials(stored) : NO_CREDS));
  const [credsTouched, setCredsTouched] = useState(false);
  const [pass, setPass] = useState(getPassphrase);
  const [credError, setCredError] = useState<string>();

  const set = <K extends keyof Exam>(k: K, v: Exam[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Unlock automatically when this device already knows the passphrase.
  useEffect(() => {
    if (!stored || !isEncrypted(stored) || !getPassphrase()) return;
    decryptText(stored, getPassphrase())
      .then((plain) => {
        setCreds(parseCredentials(plain));
        setCredState("open");
      })
      .catch(() => setCredError("This device's passphrase can't unlock these credentials."));
  }, [stored]);

  const unlock = async () => {
    try {
      const plain = await decryptText(stored, pass);
      setPassphrase(pass);
      setCreds(parseCredentials(plain));
      setCredState("open");
      setCredError(undefined);
    } catch {
      setCredError("Wrong passphrase");
    }
  };

  const titleError = submitted && !form.title.trim() ? "Give the exam a name" : undefined;
  const linkErrors = form.links.map((l) => (l.url && !/^https?:\/\//i.test(l.url) ? "Start with http:// or https://" : undefined));
  const needsPass = credsTouched && hasCreds(creds) && !pass.trim();

  const save = async () => {
    setSubmitted(true);
    if (titleError || !form.title.trim() || linkErrors.some(Boolean) || needsPass) return;
    setBusy(true);
    let credentials = form.credentials;
    if (credState !== "locked" && credsTouched) {
      if (hasCreds(creds)) {
        setPassphrase(pass.trim());
        credentials = await encryptText(JSON.stringify(creds), pass.trim());
      } else credentials = "";
    }
    const ok = await onSave(
      {
        ...form,
        title: form.title.trim(),
        links: form.links.filter((l) => l.url.trim()).map((l) => ({ title: l.title.trim(), url: l.url.trim() })),
        credentials,
      },
      isNew,
    );
    setBusy(false);
    if (ok) onClose();
  };

  const setLink = (i: number, patch: Partial<ExamLink>) =>
    set(
      "links",
      form.links.map((l, j) => (j === i ? { ...l, ...patch } : l)),
    );

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      dismissible={!busy}
      title={isNew ? "Add exam" : "Edit exam"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy}>
            {isNew ? "Add exam" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Section title="Exam">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Exam / post" htmlFor="ex-title" required error={titleError} className="sm:col-span-2">
              <Input id="ex-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Assistant Programmer" aria-invalid={Boolean(titleError)} />
            </Field>
            <Field label="Organisation" htmlFor="ex-org">
              <Input id="ex-org" value={form.organization} onChange={(e) => set("organization", e.target.value)} placeholder="e.g. Bangladesh Bank" />
            </Field>
            <Field label="Grade" htmlFor="ex-grade">
              <Input id="ex-grade" value={form.grade} onChange={(e) => set("grade", e.target.value)} placeholder="e.g. 9th grade" />
            </Field>
            <Field label="Type">
              <SegmentedControl<ExamType>
                ariaLabel="Type"
                value={form.type}
                onChange={(v) => set("type", v)}
                segments={[
                  { value: "IT", label: "IT" },
                  { value: "GENERAL", label: "General" },
                ]}
                className="h-10 w-full [&>button]:flex-1 [&>button]:justify-center"
              />
            </Field>
            <Field label="Priority">
              <SegmentedControl<ExamPriority>
                ariaLabel="Priority"
                value={form.priority}
                onChange={(v) => set("priority", v)}
                segments={[
                  { value: "HIGH", label: "High" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "LOW", label: "Low" },
                ]}
                className={cn("h-10 w-full [&>button]:flex-1 [&>button]:justify-center", PRIORITY_ACTIVE[form.priority])}
              />
            </Field>
            <Field label="Monthly salary (approx.)" htmlFor="ex-sal">
              <Input id="ex-sal" inputMode="numeric" value={form.salaryMonthly} onChange={(e) => set("salaryMonthly", e.target.value)} placeholder="e.g. 22000" />
            </Field>
            <Field label="Gross salary" htmlFor="ex-gross">
              <Input id="ex-gross" inputMode="numeric" value={form.salaryGross} onChange={(e) => set("salaryGross", e.target.value)} placeholder="e.g. 45000" />
            </Field>
            <Field label="Total seats" htmlFor="ex-seats">
              <Input id="ex-seats" inputMode="numeric" value={form.totalSeats} onChange={(e) => set("totalSeats", e.target.value)} placeholder="e.g. 40" />
            </Field>
            <div className="flex items-end pb-2.5">
              <Check checked={form.seatsConfirmed} onChange={(v) => set("seatsConfirmed", v)}>
                Seat count is confirmed (untick if it's a guess)
              </Check>
            </div>
          </div>
        </Section>

        <Section title="Dates">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Circular published" htmlFor="ex-circ">
              <DateField id="ex-circ" value={form.circularDate} onChange={(v) => set("circularDate", v)} />
            </Field>
            <div className="space-y-2">
              <Field label="Last date to apply" htmlFor="ex-dead">
                <DateField id="ex-dead" value={form.applyDeadline} onChange={(v) => set("applyDeadline", v)} />
              </Field>
              <Check checked={form.applied} onChange={(v) => set("applied", v)}>
                I've applied
              </Check>
            </div>
            <div className="space-y-2">
              <Field label="Exam date" htmlFor="ex-date">
                <DateField id="ex-date" value={form.examDate} onChange={(v) => set("examDate", v)} />
              </Field>
              <Check checked={form.examDateEstimated} onChange={(v) => set("examDateEstimated", v)}>
                Estimated — not announced yet
              </Check>
            </div>
            <Field label="Exam time" htmlFor="ex-time">
              <Input id="ex-time" type="time" value={form.examTime} onChange={(e) => set("examTime", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Exam centre">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Institute" htmlFor="ex-centre">
              <Input id="ex-centre" value={form.centreName} onChange={(e) => set("centreName", e.target.value)} placeholder="e.g. Dhaka College" />
            </Field>
            <Field label="Map link" htmlFor="ex-map" hint="Google Maps share link. Leave empty to search by name.">
              <Input id="ex-map" type="url" value={form.centreMap} onChange={(e) => set("centreMap", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
            </Field>
            <Field label="Getting there" htmlFor="ex-notes" className="sm:col-span-2" hint="Room, bike rent, travel time…">
              <Textarea id="ex-notes" rows={2} value={form.centreNotes} onChange={(e) => set("centreNotes", e.target.value)} placeholder="Bike rent ~৳150 from Mirpur 10, 40 min" />
            </Field>
          </div>
        </Section>

        <Section title="Links">
          <Field label="Official website" htmlFor="ex-web">
            <Input id="ex-web" type="url" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" />
          </Field>
          {form.links.map((l, i) => (
            <div key={i} className="flex items-start gap-2">
              <Input aria-label="Link title" value={l.title} onChange={(e) => setLink(i, { title: e.target.value })} placeholder="Title (e.g. Syllabus video)" className="sm:w-56" />
              <div className="min-w-0 flex-1">
                <Input aria-label="Link URL" type="url" value={l.url} onChange={(e) => setLink(i, { url: e.target.value })} placeholder="https://…" aria-invalid={submitted && Boolean(linkErrors[i])} />
                {submitted && linkErrors[i] && <p className="mt-1 text-xs text-danger">{linkErrors[i]}</p>}
              </div>
              <IconButton label="Remove link" icon={<Trash2 />} tone="danger" onClick={() => set("links", form.links.filter((_, j) => j !== i))} />
            </div>
          ))}
          <Button variant="soft" size="sm" icon={<Plus className="size-3.5" />} onClick={() => set("links", [...form.links, { title: "", url: "" }])}>
            Add link (video, blog, syllabus…)
          </Button>
        </Section>

        <Section title="My login">
          {credState === "locked" ? (
            <div className="space-y-3 rounded-xl border border-border bg-surface-2/50 p-4">
              <p className="flex items-center gap-2 text-sm text-fg-muted">
                <Lock className="size-4 text-fg-subtle" /> Saved and encrypted. Enter your passphrase to view or change.
              </p>
              <div className="flex gap-2">
                <Input type="password" aria-label="Passphrase" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passphrase" onKeyDown={(e) => e.key === "Enter" && void unlock()} />
                <Button variant="secondary" onClick={() => void unlock()} disabled={!pass}>
                  Unlock
                </Button>
              </div>
              {credError && <p className="text-xs text-danger">{credError}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="User ID / email" htmlFor="ex-user">
                  <Input id="ex-user" autoComplete="off" value={creds.username} onChange={(e) => (setCreds({ ...creds, username: e.target.value }), setCredsTouched(true))} />
                </Field>
                <Field label="Password" htmlFor="ex-pass">
                  <Input id="ex-pass" type="password" autoComplete="new-password" value={creds.password} onChange={(e) => (setCreds({ ...creds, password: e.target.value }), setCredsTouched(true))} />
                </Field>
                <Field label="Other (roll, tracking no.…)" htmlFor="ex-other" className="sm:col-span-2">
                  <Input id="ex-other" autoComplete="off" value={creds.other} onChange={(e) => (setCreds({ ...creds, other: e.target.value }), setCredsTouched(true))} />
                </Field>
              </div>
              {credsTouched && hasCreds(creds) && (
                <Field
                  label="Encryption passphrase"
                  htmlFor="ex-phrase"
                  error={submitted && needsPass ? "Needed to encrypt your login" : undefined}
                  hint="Remembered on this device. Use the same one on your phone to read these."
                >
                  <Input id="ex-phrase" type="password" value={pass} onChange={(e) => setPass(e.target.value)} leading={<KeyRound />} aria-invalid={submitted && needsPass} />
                </Field>
              )}
              <p className="text-xs text-fg-subtle">Encrypted on this device before saving, so the public sheet only shows unreadable text.</p>
            </div>
          )}
        </Section>

        <Section title="Notes">
          <MarkdownEditor id="ex-desc" value={form.description} onChange={(v) => set("description", v)} rows={5} placeholder={"Syllabus, exam pattern, what to revise…"} />
          <Check checked={form.hideOnDashboard} onChange={(v) => set("hideOnDashboard", v)}>
            Hide from the dashboard
          </Check>
        </Section>
      </div>
    </Modal>
  );
}
