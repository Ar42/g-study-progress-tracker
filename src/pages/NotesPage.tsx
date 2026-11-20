import { useMemo, useState, type DragEvent } from "react";
import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronRight, FolderInput, FolderPlus, Home, Link2, Pencil, Search, SearchX, Trash2 } from "lucide-react";
import { Button, Card, ConfirmDialog, EmptyState, IconButton, Input, PageHeader, Spinner } from "../components/ui";
import { cn } from "../lib/cn";
import { classifyLink } from "../lib/noteLinks";
import { canMoveTo, childrenOf, descendantIds, pathTo } from "../lib/noteTree";
import type { NoteItem } from "../types";
import { useNotes } from "../features/notes/hooks/useNotes";
import { NoteLink } from "../features/notes/components/NoteLink";
import { NoteIcon } from "../features/notes/components/NoteIcon";
import { NoteItemModal, type NoteEditorState } from "../features/notes/components/NoteItemModal";
import { MoveNoteModal } from "../features/notes/components/MoveNoteModal";

const DRAG_TYPE = "application/x-note-id";

export function NotesPage() {
  const { items, isLoading, error, writable, create, update, move, remove } = useNotes();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<NoteEditorState | null>(null);
  const [moving, setMoving] = useState<NoteItem | null>(null);
  const [deleting, setDeleting] = useState<NoteItem | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Current folder lives in the URL (?folder=id) so Back / refresh / sharing work.
  const requested = params.get("folder") ?? "";
  const folder = items.find((i) => i.id === requested && i.type === "FOLDER") ?? null;
  const folderId = folder?.id ?? "";
  const crumbs = useMemo(() => (folder ? pathTo(items, folder.id) : []), [items, folder]);
  const folderName = folder?.name ?? "My Drive";
  const open = (id: string) => setParams(id ? { folder: id } : {});

  const q = query.trim().toLocaleLowerCase();
  const list = useMemo(() => {
    if (!q) return childrenOf(items, folderId);
    return items
      .filter((i) => i.name.toLocaleLowerCase().includes(q) || (i.type === "FILE" && i.link.toLocaleLowerCase().includes(q)))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "FOLDER" ? -1 : 1));
  }, [items, folderId, q]);
  const countIn = (id: string) => items.filter((i) => i.parentId === id).length;
  const locationOf = (i: NoteItem) => pathTo(items, i.parentId).map((p) => p.name).join(" / ") || "My Drive";

  /* -------------------------------------------------------- drag & drop */
  const dragged = dragId ? items.find((i) => i.id === dragId) ?? null : null;
  const dropProps = (targetId: string, targetName: string) => ({
    onDragOver: (e: DragEvent) => {
      if (!dragged || !canMoveTo(items, dragged, targetId)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overId !== targetId) setOverId(targetId);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null) && overId === targetId) setOverId(null);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setOverId(null);
      setDragId(null);
      if (dragged && canMoveTo(items, dragged, targetId)) void move(dragged, targetId, targetName);
    },
  });
  const ROOT_DROP = "__root__";

  const deleteCount = deleting?.type === "FOLDER" ? descendantIds(items, deleting.id).length : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Drive"
        description="Your folders of links — notes, docs, exam dates, resources."
        actions={
          <>
            <Button variant="secondary" icon={<FolderPlus className="size-4" />} disabled={!writable} onClick={() => setEditor({ type: "FOLDER", parentId: folderId })}>
              New folder
            </Button>
            <Button icon={<Link2 className="size-4" />} disabled={!writable} onClick={() => setEditor({ type: "FILE", parentId: folderId })}>
              Add file
            </Button>
          </>
        }
      />

      {!isLoading && !writable && (
        <Card className="flex items-start gap-3 border-warning/30 bg-warning-soft p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm text-fg-muted">
            <span className="font-semibold text-fg">My Drive needs the latest Code.gs.</span> Copy everything in <code className="font-mono text-xs">Code.gs</code>,
            paste it over the code in Extensions → Apps Script, then Deploy → Manage deployments → edit → Version: <em>New version</em> → Deploy.
          </p>
        </Card>
      )}

      <Card>
        {/* Breadcrumbs (also drop targets) + search */}
        <div className="flex flex-col gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <nav aria-label="Folder path" className="flex min-w-0 flex-wrap items-center gap-0.5 text-sm">
            <button
              type="button"
              onClick={() => open("")}
              {...dropProps("", "top level")}
              onDragOver={(e) => {
                if (!dragged || !canMoveTo(items, dragged, "")) return;
                e.preventDefault();
                if (overId !== ROOT_DROP) setOverId(ROOT_DROP);
              }}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 hover:bg-surface-2",
                !folder && !q ? "font-semibold text-fg" : "text-fg-muted",
                overId === ROOT_DROP && "bg-primary-soft ring-2 ring-primary/40",
              )}
            >
              <Home className="size-4" /> My Drive
            </button>
            {!q &&
              crumbs.map((c, i) => (
                <span key={c.id} className="inline-flex min-w-0 items-center gap-0.5">
                  <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" />
                  <button
                    type="button"
                    onClick={() => open(c.id)}
                    {...(i < crumbs.length - 1 ? dropProps(c.id, c.name) : {})}
                    className={cn(
                      "max-w-48 cursor-pointer truncate rounded-md px-2 py-1 hover:bg-surface-2",
                      i === crumbs.length - 1 ? "font-semibold text-fg" : "text-fg-muted",
                      overId === c.id && "bg-primary-soft ring-2 ring-primary/40",
                    )}
                  >
                    {c.name}
                  </button>
                </span>
              ))}
          </nav>
          <div className="sm:w-72">
            <Input leading={<Search />} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search My Drive…" aria-label="Search My Drive" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-14 text-primary">
            <Spinner />
          </div>
        ) : error ? (
          <EmptyState icon={<AlertTriangle />} title="Couldn't load My Drive" description={error} />
        ) : list.length === 0 ? (
          q ? (
            <EmptyState icon={<SearchX />} title="Nothing matches" description="Try another word." />
          ) : (
            <EmptyState
              icon={<FolderPlus />}
              title={folder ? "This folder is empty" : "Nothing here yet"}
              description="Create a folder, or add a link to a Google Doc, PDF, video or any web page."
              action={
                writable && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setEditor({ type: "FOLDER", parentId: folderId })}>
                      New folder
                    </Button>
                    <Button onClick={() => setEditor({ type: "FILE", parentId: folderId })}>Add file</Button>
                  </div>
                )
              }
            />
          )
        ) : (
          <ul className="divide-y divide-border">
            {list.map((i) => {
              const isFolder = i.type === "FOLDER";
              const info = isFolder ? null : classifyLink(i.link);
              const sub = q ? locationOf(i) : isFolder ? `${countIn(i.id)} ${countIn(i.id) === 1 ? "item" : "items"}` : info?.host || info?.label;
              const content = (
                <>
                  <NoteIcon type={i.type} link={i.link} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">{i.name}</span>
                    <span className="block truncate text-xs text-fg-subtle">{sub}</span>
                  </span>
                </>
              );
              const rowLink = "flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg text-left px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
              return (
                <li
                  key={i.id}
                  draggable={writable}
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, i.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragId(i.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  {...(isFolder ? dropProps(i.id, i.name) : {})}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2 transition-colors sm:px-4",
                    overId === i.id ? "bg-primary-soft ring-2 ring-inset ring-primary/40" : "hover:bg-surface-2/60",
                    dragId === i.id && "opacity-40",
                  )}
                >
                  {isFolder ? (
                    <button type="button" className={rowLink} onClick={() => open(i.id)}>
                      {content}
                    </button>
                  ) : (
                    <NoteLink href={i.link} className={rowLink} title={`Open ${info?.label ?? "link"}`}>
                      {content}
                    </NoteLink>
                  )}
                  {writable && (
                    <div className="flex shrink-0 items-center lg:opacity-0 lg:transition-opacity lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                      <IconButton label={`Move ${i.name}`} icon={<FolderInput />} size="sm" onClick={() => setMoving(i)} />
                      <IconButton label={`Edit ${i.name}`} icon={<Pencil />} size="sm" onClick={() => setEditor({ type: i.type, item: i, parentId: i.parentId })} />
                      <IconButton label={`Delete ${i.name}`} icon={<Trash2 />} size="sm" tone="danger" onClick={() => setDeleting(i)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {writable && list.length > 0 && !q && (
        <p className="hidden px-1 text-xs text-fg-subtle lg:block">
          Tip: drag an item onto a folder or onto the path above to move it — or use the move button.
        </p>
      )}

      {editor && (
        <NoteItemModal
          state={editor}
          folderName={folderName}
          onClose={() => setEditor(null)}
          onSubmit={({ name, link }) => {
            const e = editor;
            setEditor(null);
            if (e.item) void update(e.item, { name, link }, "Saved");
            else void create({ type: e.type, name, link, parentId: e.parentId });
          }}
        />
      )}

      {moving && (
        <MoveNoteModal
          item={moving}
          items={items}
          onClose={() => setMoving(null)}
          onMove={(targetId, targetName) => {
            const m = moving;
            setMoving(null);
            void move(m, targetId, targetName);
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        tone="danger"
        title={deleting?.type === "FOLDER" ? "Delete folder?" : "Delete file?"}
        confirmLabel="Delete"
        message={
          deleting?.type === "FOLDER" && deleteCount > 0 ? (
            <>
              <span className="font-medium text-fg">{deleting.name}</span> and the <span className="font-semibold text-fg">{deleteCount}</span>{" "}
              {deleteCount === 1 ? "item" : "items"} inside it will be removed from the My Drive tab. Tip: move anything you want to keep out first.
            </>
          ) : (
            <>
              <span className="font-medium text-fg">{deleting?.name}</span> will be removed from the My Drive tab. {deleting?.type === "FILE" && "The linked document itself isn't touched."}
            </>
          )
        }
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const d = deleting;
          setDeleting(null);
          if (d) {
            if (d.type === "FOLDER" && (folderId === d.id || descendantIds(items, d.id).includes(folderId))) open(d.parentId);
            void remove(d);
          }
        }}
      />
    </div>
  );
}

/** /notes → /drive (keeps the folder in the query string). */
export function NotesRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/drive${search}`} replace />;
}
