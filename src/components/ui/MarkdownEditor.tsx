import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Bold, Code, Heading2, Italic, Link2, List, ListChecks, ListOrdered, Quote } from "lucide-react";
import { cn } from "../../lib/cn";
import { enterEdit, indentEdit, linePrefixEdit, linkEdit, wrapEdit, type Edit } from "../../lib/markdownEdit";
import { Markdown } from "./Markdown";
import { controlClass } from "./styles";

interface Tool {
  readonly label: string;
  readonly shortcut?: string;
  readonly icon: ReactNode;
  readonly make: (value: string, s: number, e: number) => Edit | null;
}

const TOOLS: readonly Tool[] = [
  { label: "Heading", icon: <Heading2 />, make: (v, s, e) => linePrefixEdit(v, s, e, "h2") },
  { label: "Bold", shortcut: "Ctrl+B", icon: <Bold />, make: (v, s, e) => wrapEdit(v, s, e, "**", "bold text") },
  { label: "Italic", shortcut: "Ctrl+I", icon: <Italic />, make: (v, s, e) => wrapEdit(v, s, e, "*", "italic text") },
  { label: "Bulleted list", icon: <List />, make: (v, s, e) => linePrefixEdit(v, s, e, "bullet") },
  { label: "Numbered list", icon: <ListOrdered />, make: (v, s, e) => linePrefixEdit(v, s, e, "ordered") },
  { label: "Checklist", icon: <ListChecks />, make: (v, s, e) => linePrefixEdit(v, s, e, "check") },
  { label: "Quote", icon: <Quote />, make: (v, s, e) => linePrefixEdit(v, s, e, "quote") },
  { label: "Inline code", icon: <Code />, make: (v, s, e) => wrapEdit(v, s, e, "`", "code") },
  { label: "Link", shortcut: "Ctrl+K", icon: <Link2 />, make: (v, s, e) => linkEdit(v, s, e) },
];

export interface MarkdownEditorProps {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly invalid?: boolean;
  readonly rows?: number;
}

/**
 * Plain-textarea Markdown editor: a formatting toolbar, Ctrl+B / Ctrl+I,
 * lists that continue on Enter, Tab to indent, and a Preview tab.
 * Edits go through the browser's insertText so Ctrl+Z undo keeps working.
 */
export function MarkdownEditor({ id, value, onChange, placeholder, invalid, rows = 8 }: MarkdownEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");

  const apply = (edit: Edit | null) => {
    const ta = ref.current;
    if (!edit || !ta) return;
    ta.focus();
    ta.setSelectionRange(edit.start, edit.end);
    const next = value.slice(0, edit.start) + edit.text + value.slice(edit.end);
    // execCommand keeps the native undo stack and updates the DOM synchronously,
    // so the caret can be placed right away (before any further keystrokes).
    const ok = typeof document.execCommand === "function" && document.execCommand("insertText", false, edit.text);
    if (ok && ta.value === next) {
      ta.setSelectionRange(edit.selStart, edit.selEnd);
      return;
    }
    // Fallback: controlled update, then place the caret after React re-renders.
    onChange(next);
    requestAnimationFrame(() => ref.current?.setSelectionRange(edit.selStart, edit.selEnd));
  };

  const sel = () => [ref.current?.selectionStart ?? value.length, ref.current?.selectionEnd ?? value.length] as const;

  /** Runs a toolbar edit against the current selection (refs are only read here, in the handler). */
  const runTool = (make: Tool["make"]) => {
    const [s, e] = sel();
    apply(make(value, s, e));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    const [s, en] = sel();
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && !e.altKey) {
      const key = e.key.toLowerCase();
      if (key === "b" || key === "i" || key === "k") {
        e.preventDefault();
        apply(key === "b" ? wrapEdit(value, s, en, "**", "bold text") : key === "i" ? wrapEdit(value, s, en, "*", "italic text") : linkEdit(value, s, en));
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && s === en) {
      const edit = enterEdit(value, s);
      if (edit) {
        e.preventDefault();
        apply(edit);
      }
    } else if (e.key === "Tab") {
      const edit = indentEdit(value, s, en, e.shiftKey);
      if (edit) {
        e.preventDefault();
        apply(edit);
      }
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-surface-2/70 transition-[border-color,box-shadow] focus-within:border-primary/70 focus-within:ring-4 focus-within:ring-primary/15",
        invalid ? "border-danger" : "border-border hover:border-border-strong",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-1.5 py-1">
        <div className="flex min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]" role="toolbar" aria-label="Formatting">
          {TOOLS.map((t) => (
            <button
              key={t.label}
              type="button"
              title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
              aria-label={t.label}
              disabled={tab === "preview"}
              onMouseDown={(e) => e.preventDefault() /* keep the textarea selection */}
              onClick={() => runTool(t.make)}
              className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4"
            >
              {t.icon}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 rounded-lg bg-surface-2 p-0.5 text-xs font-semibold" role="tablist">
          {(["write", "preview"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                "cursor-pointer rounded-md px-2.5 py-1 capitalize transition-colors",
                tab === k ? "bg-surface text-fg shadow-card" : "text-fg-subtle hover:text-fg",
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {tab === "write" ? (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-invalid={invalid}
          spellCheck
          className={cn(
            controlClass,
            "block resize-y rounded-none border-0 bg-transparent py-3 font-mono text-[13px] leading-relaxed hover:border-0 focus:bg-transparent focus:ring-0",
          )}
        />
      ) : (
        <div className="min-h-40 px-3.5 py-3">
          {value.trim() ? <Markdown source={value} /> : <p className="text-sm text-fg-subtle italic">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
