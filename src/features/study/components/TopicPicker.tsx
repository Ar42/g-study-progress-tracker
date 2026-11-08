import { useMemo } from "react";
import { Field, SegmentedControl, Select } from "../../../components/ui";
import { STATUS_META, type DisplayStatus } from "../../../enums/progress";
import type { StudyDomain, TreeNode } from "../../../types";
import { useSubjects, useTopics } from "../hooks/useStudyData";
import { useTopicTarget, type TopicChoice, type TopicErrors } from "../hooks/useTopicChoice";

const statusSuffix = (s: DisplayStatus) => (s === "NOT_STARTED" ? "" : `  ·  ${STATUS_META[s].label.toLowerCase()}`);

/** Flattened chapter options for one subject, indented by depth. */
function chapterOptions(nodes: readonly TreeNode[], depth = 0): { value: string; label: string }[] {
  return nodes.flatMap((n) => [
    { value: n.row.id, label: `${" ".repeat(depth)}${n.row.name}${n.isLeaf ? statusSuffix(n.status) : ""}` },
    ...chapterOptions(n.children, depth + 1),
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
  const bcsOptions = useMemo(() => (subject ? chapterOptions(subject.children) : []), [subject]);
  const itOptions = useMemo(() => topics.map((t) => ({ value: t.row.id, label: `${t.row.name}${statusSuffix(t.status)}` })), [topics]);

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
