import { useMemo, useState } from "react";
import { ListPlus } from "lucide-react";
import { Badge, Button, Field, Input, Modal, Select, Textarea } from "../../../components/ui";
import { splitList } from "../../../lib/splitList";
import { generateRowIds } from "../../../lib/id";
import { findNode } from "../../../lib/tree";
import { emptyRow } from "../../../services/rowMapper";
import type { Subject } from "../../../types";
import { useStudyActions } from "../../study/hooks/useStudyActions";
import { buildParentOptions } from "../parentOptions";

const DEFAULT_SEPARATOR = ",";

export interface QuickAddChaptersModalProps {
  readonly subject: Subject;
  readonly open: boolean;
  readonly onClose: () => void;
}

/** Add many chapters at once from a separated list (comma by default). */
export function QuickAddChaptersModal({ subject, open, onClose }: QuickAddChaptersModalProps) {
  const { createMany } = useStudyActions("BCS");
  const [separator, setSeparator] = useState(DEFAULT_SEPARATOR);
  const [text, setText] = useState("");
  const [parentId, setParentId] = useState(subject.row.id);

  const parentOptions = useMemo(() => buildParentOptions(subject, null), [subject]);

  const { toAdd, skipped } = useMemo(() => {
    const names = splitList(text, separator);
    const parent = parentId === subject.row.id ? subject : findNode(subject.children, parentId);
    const existing = new Set((parent?.children ?? []).map((c) => c.row.name.replace(/\s+/g, " ").trim().toLocaleLowerCase()));
    return {
      toAdd: names.filter((n) => !existing.has(n.toLocaleLowerCase())),
      skipped: names.filter((n) => existing.has(n.toLocaleLowerCase())),
    };
  }, [text, separator, parentId, subject]);

  const close = () => {
    setText("");
    setSeparator(DEFAULT_SEPARATOR);
    setParentId(subject.row.id);
    onClose();
  };

  const submit = () => {
    if (toAdd.length === 0) return;
    const ids = generateRowIds("ch", toAdd.length);
    const rows = toAdd.map((name, i) => emptyRow(ids[i], { name, parentId }));
    close();
    void createMany(rows);
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title="Quick add chapters"
      description={`Add several chapters to ${subject.row.name} at once`}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button icon={<ListPlus className="size-4" />} onClick={submit} disabled={toAdd.length === 0}>
            {toAdd.length > 0 ? `Add ${toAdd.length} ${toAdd.length === 1 ? "chapter" : "chapters"}` : "Add chapters"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[10rem_1fr]">
          <Field label="Separator" htmlFor="qa-sep" hint="New lines always split too">
            <Input
              id="qa-sep"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              placeholder=","
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Location" htmlFor="qa-parent">
            <Select id="qa-parent" options={parentOptions} value={parentId} onChange={(e) => setParentId(e.target.value)} />
          </Field>
        </div>

        <Field label="Chapters" htmlFor="qa-text" hint={`Separate names with “${separator || "new line"}”. Extra spaces are trimmed.`}>
          <Textarea
            id="qa-text"
            autoFocus
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit();
            }}
            placeholder={`chapter 1${separator || "\n"} chapter 2${separator || "\n"} chapter 3`}
          />
        </Field>

        <section aria-live="polite" className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">Preview</h3>
            {toAdd.length > 0 && <span className="text-xs text-fg-subtle">Ctrl + Enter to add</span>}
          </div>
          {toAdd.length === 0 && skipped.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-fg-subtle">
              Chapters will appear here as you type.
            </p>
          ) : (
            <ol className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-border bg-surface-2/50 p-2">
              {toAdd.map((name, i) => (
                <li key={name} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg">
                  <span className="w-6 text-right font-numbers text-xs text-fg-subtle">{i + 1}</span>
                  <span className="min-w-0 wrap-break-word">{name}</span>
                </li>
              ))}
              {skipped.map((name) => (
                <li key={`skip-${name}`} className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-fg-subtle">
                  <span className="w-6" />
                  <span className="min-w-0 line-through wrap-break-word">{name}</span>
                  <Badge tone="neutral">already exists</Badge>
                </li>
              ))}
            </ol>
          )}
        </section>
      </form>
    </Modal>
  );
}
