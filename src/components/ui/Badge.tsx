import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { TONE_CLASS, TONE_DOT, type Tone } from "./styles";

export interface BadgeProps {
  readonly tone?: Tone;
  readonly dot?: boolean;
  readonly icon?: ReactNode;
  readonly className?: string;
  readonly title?: string;
  readonly children: ReactNode;
}

export function Badge({ tone = "neutral", dot = false, icon, className, title, children }: BadgeProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap [&_svg]:size-3",
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
