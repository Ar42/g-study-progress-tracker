import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { TONE_CLASS, TONE_DOT, type Tone } from "./styles";

export interface BadgeProps {
  readonly tone?: Tone;
  readonly dot?: boolean;
  readonly icon?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

export function Badge({ tone = "neutral", dot = false, icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap [&_svg]:size-3",
        TONE_CLASS[tone],
        className,
      )}
    >
      {dot && <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} />}
      {icon}
      {children}
    </span>
  );
}
