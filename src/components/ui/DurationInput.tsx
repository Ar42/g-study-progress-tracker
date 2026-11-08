import { cn } from "../../lib/cn";
import { formatMinutes, parseDuration } from "../../lib/duration";
import { Input } from "./Input";

const DEFAULT_PRESETS = [30, 60, 90, 120];

export interface DurationInputProps {
  readonly id?: string;
  /** Raw text as typed ("90", "1h 30m", "1:30", "10.2"). */
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly invalid?: boolean;
  readonly placeholder?: string;
  /** Quick-pick chips in minutes; pass [] to hide. */
  readonly presets?: readonly number[];
  readonly className?: string;
}

/** Free-form duration field with a live "= 1h 30m" read-back and preset chips. */
export function DurationInput({
  id,
  value,
  onChange,
  invalid,
  placeholder = "e.g. 45, 1:30 or 1h 30m",
  presets = DEFAULT_PRESETS,
  className,
}: DurationInputProps) {
  const parsed = value.trim() ? parseDuration(value) : null;
  const readBack = parsed?.ok ? `= ${formatMinutes(parsed.minutes)}` : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="relative w-48">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          aria-invalid={invalid}
          aria-describedby={id ? `${id}-readback` : undefined}
          className="pr-20"
        />
        {readBack && (
          <span
            id={id ? `${id}-readback` : undefined}
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-primary"
          >
            {readBack}
          </span>
        )}
      </div>
      {presets.map((m) => {
        const active = parsed?.ok && parsed.minutes === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(String(m))}
            className={cn(
              "h-8 cursor-pointer rounded-lg border px-2.5 text-xs font-semibold transition-colors",
              active
                ? "border-primary/40 bg-primary-soft text-primary"
                : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {formatMinutes(m)}
          </button>
        );
      })}
    </div>
  );
}
