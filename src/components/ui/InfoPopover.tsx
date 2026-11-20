import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "../../lib/cn";

export interface InfoPopoverProps {
  readonly label: string;
  readonly children: ReactNode;
  /** Which edge of the trigger the panel lines up with. */
  readonly align?: "left" | "right";
  readonly className?: string;
}

/**
 * ⓘ button with a frosted-glass panel. Opens on hover and keyboard focus (desktop)
 * and on tap (phones); Esc or a click outside closes it.
 */
export function InfoPopover({ label, children, align = "right", className }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  // Opened by mouse hover? Then a click should keep it open, not toggle it shut.
  const viaHover = useRef(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hoverShow = () => {
    if (!open) viaHover.current = true;
    show();
  };
  // Small delay so moving the pointer from the icon into the panel doesn't close it.
  const hide = () => {
    closeTimer.current = window.setTimeout(() => {
      viaHover.current = false;
      setOpen(false);
    }, 120);
  };

  return (
    <span
      ref={root}
      className={cn("relative inline-flex", className)}
      onPointerEnter={(e) => e.pointerType === "mouse" && hoverShow()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
    >
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          if (viaHover.current) {
            viaHover.current = false; // pin it open
            setOpen(true);
          } else setOpen((v) => !v);
        }}
        onFocus={show}
        onBlur={hide}
        className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <Info className="size-4" />
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-scale-in rounded-2xl border border-border-strong/60 p-4 text-left text-sm shadow-pop",
            "bg-surface/70 backdrop-blur-xl backdrop-saturate-150",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      )}
    </span>
  );
}
