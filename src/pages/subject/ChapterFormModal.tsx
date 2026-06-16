import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X, Plus, Trash2 } from "lucide-react";
import { ProgressStatus } from "../../enums/progress";

const CLOSE_ON_ESCAPE = true;
const CLOSE_ON_OUTSIDE_CLICK = false;

const linkSchema = z.object({
  title: z.string().optional(),
  link: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  sourceName: z.string().optional()
}).refine(() => {
  // If one field is filled, others might be required, but for now just allow empty
  return true;
});

const chapterSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  status: z.nativeEnum(ProgressStatus),
  preliMarks: z.string().optional(),
  comments: z.string().optional(),
  startedDate: z.date().nullable().optional(),
  targetToCompleteDate: z.date().nullable().optional(),
  completedDate: z.date().nullable().optional(),
  links: z.array(linkSchema).optional(),
});

type ChapterFormData = z.infer<typeof chapterSchema>;

interface ChapterFormModalProps {
  readonly initialData?: any | null;
  readonly parentId: string;
  readonly onClose: () => void;
  readonly onSave: (payload: any) => void;
  readonly isSaving: boolean;
}

export const ChapterFormModal: React.FC<ChapterFormModalProps> = ({
  initialData,
  parentId,
  onClose,
  onSave,
  isSaving,
}) => {
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return null;
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
    formState: { errors }
  } = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      id: `ch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: "",
      status: ProgressStatus.NOT_STARTED,
      preliMarks: "",
      comments: "",
      startedDate: null,
      targetToCompleteDate: null,
      completedDate: null,
      links: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "links"
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id: initialData.id || `ch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: initialData.name || "",
        status: initialData.status || ProgressStatus.NOT_STARTED,
        preliMarks: initialData.preliMarks ? String(initialData.preliMarks) : "",
        comments: initialData.comments || "",
        startedDate: parseDate(initialData.startedDate),
        targetToCompleteDate: parseDate(initialData.targetToCompleteDate),
        completedDate: parseDate(initialData.completedDate),
        links: initialData.links || [],
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
    if (!date) return "";
    return date.toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  const onSubmit = (data: ChapterFormData) => {
    // Filter empty links
    const filteredLinks = data.links?.filter(l => l.title || l.link || l.sourceName) || [];
    
    const payload = {
      id: data.id,
      name: data.name,
      is_subject: false,
      parentId,
      status: data.status,
      preliMarks: data.preliMarks,
      comments: data.comments,
      startedDate: formatDate(data.startedDate),
      targetToCompleteDate: formatDate(data.targetToCompleteDate),
      completedDate: formatDate(data.completedDate),
      links: filteredLinks,
    };
    
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
         onClick={(e) => {
           if (CLOSE_ON_OUTSIDE_CLICK && e.target === e.currentTarget) {
             onClose();
           }
         }}>
      <div className="bg-bg-base border border-border-subtle rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border-subtle sticky top-0 bg-bg-base z-10">
          <h2 className="text-xl font-bold text-text-primary">
            {initialData ? "Edit Chapter" : "Add New Chapter"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">ID *</label>
              <input
                {...register("id")}
                disabled={!!initialData}
                placeholder="Unique ID"
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50"
              />
              {errors.id && <p className="text-[10px] text-red-400">{errors.id.message}</p>}
            </div> */}
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Name *</label>
              <input
                {...register("name")}
                autoFocus={!initialData}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
              {errors.name && <p className="text-[10px] text-red-400">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Status</label>
              <select
                {...register("status")}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              >
                <option value={ProgressStatus.NOT_STARTED}>Not Started</option>
                <option value={ProgressStatus.IN_PROGRESS}>In Progress</option>
                <option value={ProgressStatus.COMPLETED}>Completed</option>
              </select>
            </div>

            {/* <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary">Preli Marks</label>
              <input
                type="number"
                {...register("preliMarks")}
                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />
            </div> */}

          </div>

          <div className="pt-4 pb-2 border-t border-border-subtle mt-4">
            <h3 className="text-sm font-bold text-text-primary mb-5">Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary block">Started Date</label>
                <Controller
                  control={control}
                  name="startedDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => {
                        field.onChange(date);
                        if (date && !getValues("targetToCompleteDate")) {
                          setValue("targetToCompleteDate", date, { shouldValidate: true, shouldDirty: true });
                        }
                      }}
                      dateFormat="yyyy-MM-dd"
                      className="w-full bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                      placeholderText="Select date..."
                      isClearable
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary block">Target Date</label>
                <Controller
                  control={control}
                  name="targetToCompleteDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="yyyy-MM-dd"
                      className="w-full bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                      placeholderText="Select date..."
                      isClearable
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-text-secondary block">Completed Date</label>
                <Controller
                  control={control}
                  name="completedDate"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="yyyy-MM-dd"
                      className="w-full bg-bg-surface border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary"
                      placeholderText="Select date..."
                      isClearable
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-4">
            <label className="text-xs font-semibold text-text-secondary">Comments</label>
            <textarea
              {...register("comments")}
              rows={2}
              className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-border-subtle">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-text-primary">Links & Resources</label>
              <button
                type="button"
                onClick={() => append({ title: "", link: "", sourceName: "" })}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Link
              </button>
            </div>
            
            {fields.length === 0 ? (
              <p className="text-xs text-text-muted italic">No links added.</p>
            ) : (
              <div className="space-y-3">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-start gap-3 bg-bg-surface-hover p-3 rounded-lg border border-border-subtle">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                      <input
                        {...register(`links.${idx}.title` as const)}
                        placeholder="Title"
                        className="w-full bg-bg-surface border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                      />
                      <div className="space-y-1">
                        <input
                          {...register(`links.${idx}.link` as const)}
                          placeholder="URL (https://...)"
                          className="w-full bg-bg-surface border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                        />
                        {errors.links?.[idx]?.link && <p className="text-[10px] text-red-400">{errors.links[idx].link?.message}</p>}
                      </div>
                      {/* <input
                        {...register(`links.${idx}.sourceName` as const)}
                        placeholder="Source Name"
                        className="w-full bg-bg-surface border border-border-subtle rounded-md px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary"
                      /> */}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-1.5 text-status-notstarted hover:bg-status-notstarted/10 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-bg-surface hover:bg-bg-surface-hover border border-border-subtle rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-text-primary bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : initialData ? "Save Changes" : "Create Chapter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
