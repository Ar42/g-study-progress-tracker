import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { controlClass } from "./styles";

export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

export interface SelectProps<T extends string> extends Omit<ComponentProps<"select">, "children"> {
  readonly options: readonly SelectOption<T>[];
  /** Shown (and not selectable) while the value is "". */
  readonly placeholder?: string;
}

export function Select<T extends string>({ options, placeholder, className, ...props }: SelectProps<T>) {
  return (
    <div className="relative w-full">
      <select className={cn(controlClass, "h-10 cursor-pointer appearance-none pr-9", className)} {...props}>
        {placeholder !== undefined && (
          <option value="" disabled className="bg-surface-2 text-fg-subtle">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-2 text-fg">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
}
