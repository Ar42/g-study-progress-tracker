import { Search, X } from "lucide-react";
import { DateInput, Input, SegmentedControl, Select } from "../../../components/ui";
import type { Subject, StudyDomain } from "../../../types";
import { DEFAULT_FILTER, isDefaultFilter, type LogFilter, type Period } from "../logStats";

export interface LogFiltersProps {
  readonly value: LogFilter;
  readonly onChange: (next: LogFilter) => void;
  readonly subjects: readonly Subject[];
  readonly shown: number;
  readonly total: number;
}

export function LogFilters({ value, onChange, subjects, shown, total }: LogFiltersProps) {
  const set = (patch: Partial<LogFilter>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl<Period>
          ariaLabel="Period"
          value={value.period}
          onChange={(period) => set({ period })}
          segments={[
            { value: "7d", label: "7 days" },
            { value: "30d", label: "30 days" },
            { value: "all", label: "All time" },
            { value: "custom", label: "Custom" },
          ]}
        />
        <SegmentedControl<StudyDomain | "ALL">
          ariaLabel="Category"
          value={value.category}
          onChange={(category) => set({ category, subjectId: category === "BCS" ? value.subjectId : "" })}
          segments={[
            { value: "ALL", label: "All" },
            { value: "BCS", label: "BCS" },
            { value: "IT", label: "IT" },
          ]}
        />
        <div className="min-w-0 flex-1">
          <Input
            leading={<Search />}
            type="search"
            value={value.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search notes, subjects, topics…"
            aria-label="Search log"
          />
        </div>
      </div>

      {(value.period === "custom" || value.category === "BCS") && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {value.period === "custom" && (
            <>
              <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
                From
                <DateInput value={value.from} max={value.to || undefined} onChange={(e) => set({ from: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
                To
                <DateInput value={value.to} min={value.from || undefined} onChange={(e) => set({ to: e.target.value })} />
              </label>
            </>
          )}
          {value.category === "BCS" && (
            <label className="flex flex-col gap-1 text-xs font-semibold text-fg-muted">
              Subject
              <Select
                value={value.subjectId}
                onChange={(e) => set({ subjectId: e.target.value })}
                options={[{ value: "", label: "All subjects" }, ...subjects.map((s) => ({ value: s.row.id, label: s.row.name }))]}
              />
            </label>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-fg-subtle">
        <span>
          Showing <span className="font-numbers text-fg">{shown}</span> of {total} entries
        </span>
        {!isDefaultFilter(value) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTER)}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-primary hover:underline"
          >
            <X className="size-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
