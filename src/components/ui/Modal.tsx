import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/cn";
import { MODAL_CLOSE_ON_ESCAPE, MODAL_CLOSE_ON_OUTSIDE_CLICK } from "../../config/constants";
import { IconButton } from "./IconButton";

export interface ModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: "sm" | "md" | "lg";
  /** Disable dismissal while something is in flight. */
  readonly dismissible?: boolean;
}

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

/** Open modals, newest last — only the topmost one reacts to Escape. */
const openStack: string[] = [];

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    openStack.push(titleId);
    document.body.style.overflow = "hidden";
    return () => {
      openStack.splice(openStack.indexOf(titleId), 1);
      if (openStack.length === 0) document.body.style.overflow = "";
    };
  }, [open, titleId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const isTop = openStack[openStack.length - 1] === titleId;
      if (e.key === "Escape" && isTop && MODAL_CLOSE_ON_ESCAPE && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, dismissible, titleId]);

  // Focus the panel (not the first input) unless a child requested autofocus.
  useEffect(() => {
    if (open && panelRef.current && !panelRef.current.contains(document.activeElement)) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-[2px] animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (MODAL_CLOSE_ON_OUTSIDE_CLICK && dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "flex max-h-[92dvh] w-full flex-col overflow-hidden border border-border bg-surface shadow-2xl shadow-black/50 outline-none animate-scale-in",
          "rounded-t-2xl sm:rounded-2xl",
          SIZES[size],
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
          </div>
          <IconButton label="Close" icon={<X />} onClick={onClose} disabled={!dismissible} className="-mr-2 -mt-1" />
        </header>
        {children && <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>}
        {footer && (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-surface px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
