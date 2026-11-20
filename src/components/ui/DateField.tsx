import { useRef, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "../../lib/cn";
import { todayISO } from "../../lib/date";
import { parseDateText } from "../../lib/dateText";
import { controlClass } from "./styles";

export interface DateFieldProps {
  readonly id?: string;
  /** ISO yyyy-mm-dd or "". */
  readonly value: string;
  readonly onChange: (iso: string) => void;
  readonly min?: string;
  readonly max?: string;
  readonly ariaLabel?: string;
  readonly placeholder?: string;
  readonly className?: string;
}

const show = (iso: string) => {
  const d = iso ? parseISO(iso) : null;
  return d && isValid(d) ? format(d, "d MMM yyyy") : "";
};

/**
 * A date you can TYPE (21/11/2026, 21-11, 21 Nov, today…) or pick from the
 * calendar button. Typed text is applied on Enter or when leaving the field.
 */
export function DateField({ id, value, onChange, min, max, ariaLabel, placeholder = "e.g. 21/11/2026 or 21 Nov", className }: DateFieldProps) {
  const [text, setText] = useState<string | null>(null); // null = showing the saved value
  const [error, setError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);

  const commit = () => {
    if (text === null) return;
    const t = text.trim();
    if (!t) {
      onChange("");
      setText(null);
      setError(null);
      return;
    }
    const iso = parseDateText(t, todayISO());
    if (!iso) return setError("Try 21/11/2026, 21-11 or 21 Nov");
    if (min && iso < min) return setError(`Must be on or after ${show(min)}`);
    if (max && iso > max) return setError(`Must be on or before ${show(max)}`);
    onChange(iso);
    setText(null);
    setError(null);
  };

  const openPicker = () => {
    const el = picker.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="text"
          autoComplete="off"
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          value={text ?? show(value)}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape" && text !== null) {
              e.stopPropagation();
              setText(null);
              setError(null);
            }
          }}
          className={cn(controlClass, "h-10 pr-10 font-medium tabular-nums")}
        />
        <button
          type="button"
          onClick={openPicker}
          aria-label="Open calendar"
          title="Open calendar"
          className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center rounded-r-xl text-fg-subtle hover:text-primary"
        >
          <CalendarDays className="size-4" />
        </button>
        {/* Native calendar, opened by the button; kept rendered (but invisible) so showPicker() works. */}
        <input
          ref={picker}
          type="date"
          tabIndex={-1}
          aria-hidden
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            onChange(e.target.value);
            setText(null);
            setError(null);
          }}
          className="pointer-events-none absolute right-0 bottom-0 h-0 w-0 opacity-0"
        />
      </div>
      {error && <p className="mt-1 text-xs font-normal text-danger">{error}</p>}
    </div>
  );
}
