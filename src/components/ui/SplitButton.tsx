import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SplitButtonItem {
  readonly label: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly onSelect: () => void;
}

export interface SplitButtonProps {
  /** Main (default) action — clicking the button body runs this. */
  readonly label: string;
  readonly icon?: ReactNode;
  readonly onClick: () => void;
  /** Extra actions shown when the arrow is clicked. */
  readonly items: readonly SplitButtonItem[];
  readonly menuLabel?: string;
  readonly disabled?: boolean;
}

const segment =
  "inline-flex h-10 cursor-pointer items-center justify-center bg-primary text-sm font-semibold text-primary-fg transition-colors hover:bg-primary-hover focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-45";

/**
 * A primary button with an attached dropdown arrow. The body keeps its normal
 * behaviour; only the arrow opens the menu of alternative actions.
 */
export function SplitButton({ label, icon, onClick, items, menuLabel = "More options", disabled }: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    menuRef.current?.querySelector<HTMLButtonElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const els = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLButtonElement);
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };

  return (
    <div ref={rootRef} className="relative inline-flex rounded-lg shadow-sm">
      <button type="button" onClick={onClick} disabled={disabled} className={cn(segment, "gap-2 rounded-l-lg px-4")}>
        {icon}
        {label}
      </button>
      <button
        type="button"
        aria-label={menuLabel}
        title={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(segment, "rounded-r-lg border-l border-primary-fg/25 px-2.5")}
      >
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          onKeyDown={onMenuKey}
          className="absolute top-full right-0 z-40 mt-2 w-64 animate-scale-in overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-pop"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className="flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
            >
              {item.icon && <span className="mt-0.5 text-primary [&_svg]:size-4">{item.icon}</span>}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-fg">{item.label}</span>
                {item.description && <span className="mt-0.5 block text-xs text-fg-subtle">{item.description}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
