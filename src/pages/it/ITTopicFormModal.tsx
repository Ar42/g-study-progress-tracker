import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X, Plus, Trash2 } from "lucide-react";
import { ProgressStatus } from "../../enums/progress";
import type { ITTopic } from "../../types";

const CLOSE_ON_ESCAPE = true;
const CLOSE_ON_OUTSIDE_CLICK = false;

const linkSchema = z.object({
  title: z.string().optional(),
  link: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  sourceName: z.string().optional(),
});

const itTopicSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Topic name is required"),
  status: z.nativeEnum(ProgressStatus),
  comments: z.string().optional(),
  startedDate: z.date().nullable().optional(),
  targetToCompleteDate: z.date().nullable().optional(),
  completedDate: z.date().nullable().optional(),
  links: z.array(linkSchema).optional(),
});

type ITTopicFormData = z.infer<typeof itTopicSchema>;

interface ITTopicFormModalProps {
  readonly initialData?: ITTopic | null;
  readonly onClose: () => void;
  readonly onSave: (payload: any) => void;
  readonly isSaving: boolean;
}

export const ITTopicFormModal: React.FC<ITTopicFormModalProps> = ({
  initialData,
  onClose,
  onSave,
  isSaving,
}) => {
  const parseDate = (dateStr?: string) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr.trim())) {
      const [d, m, y] = dateStr.trim().split("-");
      const date = new Date(`${y}-${m}-${d}`);
      return isNaN(date.getTime()) ? null : date;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ITTopicFormData>({
    resolver: zodResolver(itTopicSchema),
    defaultValues: {
      id: `it-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: "",
      status: ProgressStatus.NOT_STARTED,
      comments: "",
      startedDate: null,
      targetToCompleteDate: null,
      completedDate: null,
      links: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links",
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id || `it-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: initialData.name || "",
        status: initialData.status || ProgressStatus.NOT_STARTED,
        comments: initialData.comments || "",
        startedDate: parseDate(initialData.startedDate),
        targetToCompleteDate: parseDate(initialData.targetToCompleteDate),
        completedDate: parseDate(initialData.completedDate),
        links: initialData.links ? [...initialData.links] : [],
      });
    }
  }, [initialData, reset]);

  useEffect(() => {
    if (!CLOSE_ON_ESCAPE) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formatDate = (date?: Date | null) => {
    if (!date || isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  const onSubmit = (data: ITTopicFormData) => {
    const filteredLinks =
      data.links?.filter((l) => l.title || l.link || l.sourceName) || [];

    const finalId =
      data.id ||
      initialData?.id ||
      `it-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let safeStatus = data.status;
    if (safeStatus === ProgressStatus.OVERDUE) {
      safeStatus = ProgressStatus.IN_PROGRESS;
    }

    const payload = {
      id: finalId,
      name: data.name,
      domain: "IT",
      status: safeStatus,
      comments: data.comments || "",
      startedDate: formatDate(data.startedDate),
      targetToCompleteDate: formatDate(data.targetToCompleteDate),
      completedDate: formatDate(data.completedDate),
      links: filteredLinks,
    };

    onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (CLOSE_ON_OUTSIDE_CLICK && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-bg-base border border-border-subtle rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-base z-10">
          <h2 className="text-xl font-bold text-text-primary">
            {initialData ? "Edit IT Topic" : "Add IT Topic"}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-text-muted hover:bg-bg-surface-hover hover:text-text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <input type="hidden" {...register("id")} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Topic Name *
              </label>
              <input
                {...register("name")}
                autoFocus={!initialData}
                placeholder="e.g. Operating System, Database Indexing"
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
              {errors.name && (
                <p className="text-[10px] text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value={ProgressStatus.NOT_STARTED}>Not Started</option>
                <option value={ProgressStatus.IN_PROGRESS}>In Progress</option>
                <option value={ProgressStatus.COMPLETED}>Completed</option>
              </select>
            </div>
          </div>

          <div className="pt-4 pb-2 border-t border-border-subtle mt-4">
            <h3 className="text-sm font-bold text-text-primary mb-5">
              Timeline
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary block">
                  Started Date
                </label>
                <Controller
                  control={control}
                  name="startedDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => {
                        field.onChange(date);
                        const currentTarget = getValues("targetToCompleteDate");
                        if (date && !currentTarget) {
                          setValue("targetToCompleteDate", date);
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select start date"
                      className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                      wrapperClassName="w-full"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary block">
                  Target Date
                </label>
                <Controller
                  control={control}
                  name="targetToCompleteDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select target date"
                      className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                      wrapperClassName="w-full"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary block">
                  Completed Date
                </label>
                <Controller
                  control={control}
                  name="completedDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select completion date"
                      className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                      wrapperClassName="w-full"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <label className="text-xs font-semibold text-text-secondary">
              Comments / Notes
            </label>
            <textarea
              {...register("comments")}
              rows={3}
              placeholder="Add key notes, summaries, or reminders..."
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">
                Resources & Study Links
              </label>
              <button
                type="button"
                onClick={() => append({ title: "", link: "", sourceName: "" })}
                className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Link
              </button>
            </div>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-bg-surface/50 p-3 rounded-lg border border-border-subtle"
              >
                <input
                  {...register(`links.${idx}.title`)}
                  placeholder="Title (e.g. OS Notes)"
                  className="w-full sm:w-1/3 bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
                <input
                  {...register(`links.${idx}.link`)}
                  placeholder="https://..."
                  className="w-full sm:flex-1 bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
                <input
                  {...register(`links.${idx}.sourceName`)}
                  placeholder="Source (e.g. YouTube)"
                  className="w-full sm:w-1/4 bg-bg-surface border border-border-subtle rounded-md px-2.5 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-1.5 text-text-muted hover:text-red-400 rounded transition-colors self-end sm:self-center cursor-pointer"
                  title="Remove link"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create Topic"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
ITTopicFormModal.displayName = "ITTopicFormModal";
