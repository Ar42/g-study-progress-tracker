import type { ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";
import { controlClass } from "./styles";

export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
  /** Options with the same group are shown under one heading, in first-seen order. */
  readonly group?: string;
  /** Text colour class for the option (and the select when it's chosen). */
  readonly toneClass?: string;
}

export interface SelectProps<T extends string> extends Omit<ComponentProps<"select">, "children"> {
  readonly options: readonly SelectOption<T>[];
  /** Shown (and not selectable) while the value is "". */
  readonly placeholder?: string;
}

const renderOption = <T extends string>(o: SelectOption<T>) => (
  <option key={o.value} value={o.value} className={cn("bg-surface-2", o.toneClass ?? "text-fg")}>
    {o.label}
  </option>
);

export function Select<T extends string>({ options, placeholder, className, ...props }: SelectProps<T>) {
  const chosen = options.find((o) => o.value === props.value);
  const groups: string[] = [];
  for (const o of options) if (o.group && !groups.includes(o.group)) groups.push(o.group);
  return (
    <div className="relative w-full">
      <select className={cn(controlClass, "h-10 cursor-pointer appearance-none pr-9", chosen?.toneClass, className)} {...props}>
        {placeholder !== undefined && (
          <option value="" disabled className="bg-surface-2 text-fg-subtle">
            {placeholder}
          </option>
        )}
        {options.filter((o) => !o.group).map(renderOption)}
        {groups.map((g) => (
          <optgroup key={g} label={g} className="bg-surface-2 text-fg-subtle">
            {options.filter((o) => o.group === g).map(renderOption)}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
    </div>
  );
}
