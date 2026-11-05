import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Button, DateInput, Field, IconButton, Input, Modal, Select, Textarea } from "../../../components/ui";
import { ProgressStatus, STATUS_META, STORED_STATUSES, type StoredStatus } from "../../../enums/progress";
import { todayISO } from "../../../lib/date";
import type { StudyRow } from "../../../types";

export type ItemKind = "subject" | "chapter" | "topic";

const KIND_LABEL: Record<ItemKind, string> = { subject: "subject", chapter: "chapter", topic: "topic" };

const linkSchema = z
  .object({
    title: z.string().trim(),
    link: z.string().trim(),
    sourceName: z.string().trim(),
  })
  .superRefine((l, ctx) => {
    if (!l.link && (l.title || l.sourceName)) {
      ctx.addIssue({ code: "custom", path: ["link"], message: "Add a URL or remove this link" });
    } else if (l.link && !z.url().safeParse(l.link).success) {
      ctx.addIssue({ code: "custom", path: ["link"], message: "Enter a full URL (https://…)" });
    }
  });

const schema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  status: z.enum(STORED_STATUSES as [StoredStatus, ...StoredStatus[]]),
  parentId: z.string(),
  preliMarks: z
    .string()
    .trim()
    .regex(/^(\d+(\.\d+)?)?$/, "Use a number, e.g. 15"),
  startedDate: z.string(),
  targetDate: z.string(),
  completedDate: z.string(),
  comments: z.string(),
  links: z.array(linkSchema),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = STORED_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }));

function toFormValues(row: StudyRow): FormValues {
  return {
    name: row.name,
    status: row.status,
    parentId: row.parentId,
    preliMarks: row.preliMarks,
    startedDate: row.startedDate,
    targetDate: row.targetDate,
    completedDate: row.completedDate,
    comments: row.comments,
    links: row.links.map((l) => ({ ...l })),
  };
}

export interface StudyItemFormModalProps {
  readonly open: boolean;
  readonly kind: ItemKind;
  readonly mode: "create" | "edit";
  /** Row being edited, or a pre-filled blank row (with id/parentId) when creating. */
  readonly initial: StudyRow;
  /** Chapter only: where the chapter can live. */
  readonly parentOptions?: readonly { value: string; label: string }[];
  readonly onClose: () => void;
  readonly onSubmit: (row: StudyRow) => void;
  readonly onDelete?: () => void;
  readonly deleteDisabledReason?: string;
}

export function StudyItemFormModal({
  open,
  kind,
  mode,
  initial,
  parentOptions,
  onClose,
  onSubmit,
  onDelete,
  deleteDisabledReason,
}: StudyItemFormModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toFormValues(initial) });

  const { fields, append, remove } = useFieldArray({ control, name: "links" });

  useEffect(() => {
    if (open) reset(toFormValues(initial));
  }, [open, initial, reset]);

  const showStatus = kind !== "subject";
  const showMarks = kind !== "topic";
  const showDates = kind !== "subject";

  const submit = handleSubmit((v) => {
    const linksChanged = JSON.stringify(v.links) !== JSON.stringify(initial.links);
    onSubmit({
      ...initial,
      name: v.name,
      status: showStatus ? v.status : initial.status,
      parentId: kind === "chapter" ? v.parentId : initial.parentId,
      preliMarks: v.preliMarks,
      startedDate: v.startedDate,
      targetDate: v.targetDate,
      completedDate: v.completedDate,
      comments: v.comments.trim(),
      links: v.links.filter((l) => l.link),
      // Only drop an unparseable legacy links cell if the user actually edited links.
      linksRaw: linksChanged ? null : initial.linksRaw,
    });
  });

  const onStatusChange = (status: StoredStatus) => {
    const today = todayISO();
    const opts = { shouldDirty: true } as const;
    if (status === ProgressStatus.COMPLETED || status === ProgressStatus.IN_PROGRESS) {
      if (!getValues("startedDate")) setValue("startedDate", today, opts);
    }
    if (status === ProgressStatus.COMPLETED && !getValues("completedDate")) {
      setValue("completedDate", today, opts);
    }
    if (status !== ProgressStatus.COMPLETED) setValue("completedDate", "", opts);
  };

  const title = `${mode === "create" ? "New" : "Edit"} ${KIND_LABEL[kind]}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={mode === "edit" ? initial.name : undefined}
      size="lg"
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center">
          {onDelete && mode === "edit" && (
            <Button
              variant="ghost"
              icon={<Trash2 className="size-4" />}
              onClick={onDelete}
              disabled={Boolean(deleteDisabledReason)}
              title={deleteDisabledReason}
              className="text-danger hover:bg-danger-soft hover:text-danger sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" form="study-item-form" disabled={mode === "edit" && !isDirty}>
              {mode === "create" ? `Add ${KIND_LABEL[kind]}` : "Save changes"}
            </Button>
          </div>
        </div>
      }
    >
      <form id="study-item-form" onSubmit={submit} className="space-y-6" noValidate>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <Field label="Name" htmlFor="f-name" required error={errors.name?.message} className="sm:col-span-6">
            <Input
              id="f-name"
              autoFocus={mode === "create"}
              placeholder={kind === "topic" ? "e.g. Operating System" : "e.g. অধ্যায়-১"}
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>

          {showStatus && (
            <Field label="Status" htmlFor="f-status" className="sm:col-span-3">
              <Select
                id="f-status"
                options={STATUS_OPTIONS}
                {...register("status", { onChange: (e) => onStatusChange(e.target.value as StoredStatus) })}
              />
            </Field>
          )}

          {kind === "chapter" && parentOptions && parentOptions.length > 1 && (
            <Field label="Location" htmlFor="f-parent" className="sm:col-span-3">
              <Select id="f-parent" options={parentOptions} {...register("parentId")} />
            </Field>
          )}

          {showMarks && (
            <Field
              label="Preli marks"
              htmlFor="f-marks"
              error={errors.preliMarks?.message}
              className={kind === "subject" ? "sm:col-span-2" : "sm:col-span-3"}
            >
              <Input
                id="f-marks"
                inputMode="decimal"
                placeholder="e.g. 15"
                aria-invalid={Boolean(errors.preliMarks)}
                {...register("preliMarks")}
              />
            </Field>
          )}
        </section>

        {showDates && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Timeline</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Started" htmlFor="f-started">
                <DateInput
                  id="f-started"
                  {...register("startedDate", {
                    onChange: (e) => {
                      if (e.target.value && !getValues("targetDate")) {
                        setValue("targetDate", e.target.value, { shouldDirty: true });
                      }
                    },
                  })}
                />
              </Field>
              <Field label="Target" htmlFor="f-target" hint="Past this date, in-progress becomes overdue">
                <DateInput id="f-target" {...register("targetDate")} />
              </Field>
              <Field label="Completed" htmlFor="f-completed">
                <DateInput id="f-completed" {...register("completedDate")} />
              </Field>
            </div>
          </section>
        )}

        <Field label="Notes" htmlFor="f-comments">
          <Textarea id="f-comments" rows={3} placeholder="Anything worth remembering…" {...register("comments")} />
        </Field>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Resources</h3>
            <Button
              size="sm"
              variant="soft"
              icon={<Plus className="size-3.5" />}
              onClick={() => append({ title: "", link: "", sourceName: "" })}
            >
              Add link
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-3 text-xs text-fg-subtle">
              <Link2 className="size-3.5" /> No links yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {fields.map((f, i) => {
                const err = errors.links?.[i]?.link?.message;
                return (
                  <li key={f.id} className="rounded-lg border border-border bg-surface-2/50 p-3">
                    <div className="flex items-start gap-2">
                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input placeholder="Title" aria-label="Link title" {...register(`links.${i}.title`)} />
                        <Input placeholder="Source (optional)" aria-label="Source" {...register(`links.${i}.sourceName`)} />
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="https://…"
                            aria-label="URL"
                            inputMode="url"
                            aria-invalid={Boolean(err)}
                            {...register(`links.${i}.link`)}
                          />
                          {err && <p className="mt-1 text-xs text-danger">{err}</p>}
                        </div>
                      </div>
                      <IconButton label="Remove link" tone="danger" icon={<Trash2 />} onClick={() => remove(i)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </form>
    </Modal>
  );
}
