import { useMemo } from "react";
import { Field, SegmentedControl, Select, type SelectOption } from "../../../components/ui";
import { type DisplayStatus } from "../../../enums/progress";
import type { StudyDomain, TreeNode } from "../../../types";
import { useSubjects, useTopics } from "../hooks/useStudyData";
import { useTopicTarget, type TopicChoice, type TopicErrors } from "../hooks/useTopicChoice";

/** Pending first (overdue, in progress), then not started, then completed. */
const GROUPS: { label: string; statuses: DisplayStatus[]; toneClass: string }[] = [
  { label: "Pending", statuses: ["OVERDUE", "IN_PROGRESS"], toneClass: "text-info" },
  { label: "Not started", statuses: ["NOT_STARTED"], toneClass: "text-fg" },
  { label: "Completed", statuses: ["COMPLETED"], toneClass: "text-success" },
];
const TONE: Record<DisplayStatus, string> = {
  OVERDUE: "text-danger",
  IN_PROGRESS: "text-info",
  NOT_STARTED: "text-fg",
  COMPLETED: "text-success",
};

interface Item {
  readonly id: string;
  readonly label: string;
  readonly status: DisplayStatus;
}

function groupedOptions(items: readonly Item[]): SelectOption[] {
  return GROUPS.flatMap((g) =>
    items
      .filter((i) => g.statuses.includes(i.status))
      .map((i) => ({
        value: i.id,
        label: i.status === "OVERDUE" ? `${i.label}  ·  overdue` : i.label,
        group: g.label,
        toneClass: TONE[i.status],
      })),
  );
}

/** Every chapter of a subject, labelled with its parent path, keeping tree order inside each group. */
function chapterItems(nodes: readonly TreeNode[], path: string[] = []): Item[] {
  return nodes.flatMap((n) => [
    { id: n.row.id, label: [...path, n.row.name].join(" › "), status: n.status },
    ...chapterItems(n.children, [...path, n.row.name]),
  ]);
}

export interface TopicPickerProps {
  readonly value: TopicChoice;
  readonly onChange: (next: TopicChoice) => void;
  readonly errors?: TopicErrors;
  /** When given, shows "Also mark … as in progress" for unstarted topics. */
  readonly markActive?: boolean;
  readonly onMarkActiveChange?: (v: boolean) => void;
  readonly idPrefix?: string;
}

/** Category tabs → subject → chapter (BCS) or IT topic. Shared by the log form and the timer. */
export function TopicPicker({ value, onChange, errors = {}, markActive, onMarkActiveChange, idPrefix = "tp" }: TopicPickerProps) {
  const { subjects } = useSubjects();
  const { topics } = useTopics();
  const target = useTopicTarget(value);

  const subject = subjects.find((s) => s.row.id === value.subjectId);
  const bcsOptions = useMemo(() => (subject ? groupedOptions(chapterItems(subject.children)) : []), [subject]);
  const itOptions = useMemo(() => groupedOptions(topics.map((t) => ({ id: t.row.id, label: t.row.name, status: t.status }))), [topics]);

  return (
    <div className="space-y-4">
      <Field label="Category" required>
        <SegmentedControl<StudyDomain>
          ariaLabel="Category"
          value={value.category}
          onChange={(category) => category !== value.category && onChange({ category, subjectId: "", topicId: "" })}
          segments={[
            { value: "BCS", label: "BCS" },
            { value: "IT", label: "IT" },
          ]}
          className="h-10 w-full sm:w-64 [&>button]:flex-1 [&>button]:justify-center"
        />
      </Field>

      {value.category === "BCS" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Subject" htmlFor={`${idPrefix}-subject`} required error={errors.subject}>
            <Select
              id={`${idPrefix}-subject`}
              placeholder="Select a subject…"
              value={value.subjectId}
              options={subjects.map((s) => ({ value: s.row.id, label: s.row.name }))}
              onChange={(e) => onChange({ ...value, subjectId: e.target.value, topicId: "" })}
              aria-invalid={Boolean(errors.subject)}
            />
          </Field>
          <Field
            label="Chapter / topic"
            htmlFor={`${idPrefix}-topic`}
            required
            error={errors.topic}
            hint={!value.subjectId ? "Pick a subject first" : bcsOptions.length === 0 ? "This subject has no chapters yet" : undefined}
          >
            <Select
              id={`${idPrefix}-topic`}
              placeholder={value.subjectId ? "Select a chapter…" : "—"}
              value={value.topicId}
              options={bcsOptions}
              disabled={!value.subjectId || bcsOptions.length === 0}
              onChange={(e) => onChange({ ...value, topicId: e.target.value })}
              aria-invalid={Boolean(errors.topic)}
            />
          </Field>
        </div>
      ) : (
        <Field label="Topic" htmlFor={`${idPrefix}-topic`} required error={errors.topic}>
          <Select
            id={`${idPrefix}-topic`}
            placeholder="Select an IT topic…"
            value={value.topicId}
            options={itOptions}
            onChange={(e) => onChange({ ...value, topicId: e.target.value })}
            aria-invalid={Boolean(errors.topic)}
          />
        </Field>
      )}

      {onMarkActiveChange && target.canMark && target.row && (
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-surface-2/50 px-3 py-2.5 text-sm text-fg-muted">
          <input
            type="checkbox"
            checked={Boolean(markActive)}
            onChange={(e) => onMarkActiveChange(e.target.checked)}
            className="size-4 accent-(--c-primary)"
          />
          Also mark <span className="font-semibold text-fg">{target.row.name}</span> as in progress
        </label>
      )}
    </div>
  );
}
