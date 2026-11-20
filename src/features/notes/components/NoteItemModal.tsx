import { useState } from "react";
import { Button, Field, Input, Modal } from "../../../components/ui";
import { classifyLink, normalizeLink, parseUrl } from "../../../lib/noteLinks";
import type { NoteItem } from "../../../types";
import { NoteIcon } from "./NoteIcon";

export interface NoteEditorState {
  readonly type: "FOLDER" | "FILE";
  /** Present when editing. */
  readonly item?: NoteItem;
  /** Folder to create in ("" = top level). */
  readonly parentId: string;
}

export interface NoteItemModalProps {
  readonly state: NoteEditorState;
  readonly folderName: string;
  readonly onClose: () => void;
  readonly onSubmit: (fields: { name: string; link: string }) => void;
}

/** Create or edit a folder (name) or a file (name + link). */
export function NoteItemModal({ state, folderName, onClose, onSubmit }: NoteItemModalProps) {
  const isFile = state.type === "FILE";
  const editing = Boolean(state.item);
  const [name, setName] = useState(state.item?.name ?? "");
  const [link, setLink] = useState(state.item?.link ?? "");
  const [submitted, setSubmitted] = useState(false);

  const normalized = normalizeLink(link);
  const linkOk = !isFile || Boolean(parseUrl(normalized));
  const info = isFile && linkOk && link.trim() ? classifyLink(normalized) : null;
  const nameError = submitted && !name.trim() ? "Give it a name" : undefined;
  const linkError = submitted && isFile ? (!link.trim() ? "Paste the link" : !linkOk ? "That doesn't look like a web link" : undefined) : undefined;

  const submit = () => {
    setSubmitted(true);
    if (!name.trim() || (isFile && (!link.trim() || !linkOk))) return;
    onSubmit({ name: name.trim().replace(/\s+/g, " "), link: isFile ? normalized : "" });
  };

  // Paste a link first? Suggest a name from it.
  const suggestName = () => {
    if (name.trim() || !info) return;
    const u = parseUrl(normalized);
    if (!u) return;
    const last = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? "").replace(/\.[a-z0-9]{2,4}$/i, "");
    if (info.kind === "web" || info.kind === "pdf") setName(last && last.length < 60 ? last.replace(/[-_]+/g, " ") : info.host);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`${editing ? "Edit" : "New"} ${isFile ? "file" : "folder"}`}
      description={editing ? undefined : `In ${folderName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit}>{editing ? "Save" : isFile ? "Add file" : "Create folder"}</Button>
        </>
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        // Enter in the link or name field saves (the Save button lives in the footer, outside the form).
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            // Link entered but no name yet → jump to the name field instead of erroring.
            if (e.target.id === "note-link" && !name.trim()) {
              suggestName();
              document.getElementById("note-name")?.focus();
              return;
            }
            submit();
          }
        }}
      >
        {isFile && (
          <Field
            label="Link"
            htmlFor="note-link"
            required
            error={linkError}
            hint={info ? undefined : "Google Docs links open in the Google Docs app on your phone."}
          >
            <Input
              id="note-link"
              value={link}
              autoFocus={!editing}
              inputMode="url"
              placeholder="https://docs.google.com/document/d/…"
              onChange={(e) => setLink(e.target.value)}
              onBlur={suggestName}
              aria-invalid={Boolean(linkError)}
            />
          </Field>
        )}
        {info && (
          <p className="-mt-2 flex items-center gap-2 text-xs text-fg-muted">
            <NoteIcon type="FILE" link={normalized} className="size-4" />
            {info.label}
            {info.host && <span className="text-fg-subtle">· {info.host}</span>}
          </p>
        )}
        <Field label="Name" htmlFor="note-name" required error={nameError}>
          <Input
            id="note-name"
            value={name}
            autoFocus={!isFile && !editing}
            placeholder={isFile ? "e.g. চর্যাপদ — short notes" : "e.g. বাংলা সাহিত্য"}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError)}
          />
        </Field>
      </form>
    </Modal>
  );
}
