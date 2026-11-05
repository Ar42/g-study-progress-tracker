import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronsDownUp, ChevronsUpDown, FolderSearch, Pencil, Plus, SearchX } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  PageHeader,
  ProgressRing,
  SegmentedControl,
  StatusBar,
} from "../components/ui";
import { statusSegments } from "../features/study/statusSegments";
import { useSubjects } from "../features/study/hooks/useStudyData";
import { useStudyActions } from "../features/study/hooks/useStudyActions";
import { ChapterTree } from "../features/bcs/components/ChapterTree";
import { ChapterEditor, type EditorState } from "../features/bcs/components/ChapterEditor";
import { useChapterMove } from "../features/bcs/hooks/useChapterMove";
import { collectLeaves, countByStatus, filterTree } from "../lib/tree";
import { STATUS_FILTER_OPTIONS, type StatusFilter } from "../enums/progress";
import { emptyRow } from "../services/rowMapper";
import { generateRowId } from "../lib/id";
import type { TreeNode } from "../types";

export function SubjectPage() {
  const { subjectId = "" } = useParams();
  const { subjects } = useSubjects();
  const subject = subjects.find((s) => s.row.id === subjectId);

  const { setStatus } = useStudyActions("BCS");
  const move = useChapterMove(subject);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [editor, setEditor] = useState<EditorState | null>(null);

  const leaves = useMemo(() => (subject ? collectLeaves(subject.children) : []), [subject]);
  const counts = useMemo(() => countByStatus(leaves.map((l) => l.status)), [leaves]);
  const visible = useMemo(() => (subject ? filterTree(subject.children, filter) : []), [subject, filter]);

  if (!subject) {
    return (
      <EmptyState
        icon={<FolderSearch />}
        title="Subject not found"
        description="It may have been renamed or marked as a draft in the sheet."
        action={
          <Link to="/" className="text-sm font-medium text-primary hover:underline">
            Back to dashboard
          </Link>
        }
      />
    );
  }

  const folderIds = (nodes: readonly TreeNode[]): string[] =>
    nodes.flatMap((n) => (n.isLeaf ? [] : [n.row.id, ...folderIds(n.children)]));
  const allCollapsed = collapsed.size > 0;

  const openCreate = () =>
    setEditor({
      mode: "create",
      kind: "chapter",
      row: emptyRow(generateRowId("ch"), { parentId: subject.row.id }),
    });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={
          <Link to="/" className="inline-flex items-center gap-1 hover:underline">
            <ChevronLeft className="size-3.5" /> Dashboard
          </Link>
        }
        title={
          <span className="inline-flex flex-wrap items-center gap-2">
            {subject.row.name}
            <IconButton
              label="Edit subject details"
              icon={<Pencil />}
              size="sm"
              onClick={() => setEditor({ mode: "edit", kind: "subject", row: subject.row })}
            />
          </span>
        }
        description={subject.row.comments || undefined}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={openCreate}>
            Add chapter
          </Button>
        }
      />

      <Card className="relative overflow-hidden p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-10 size-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProgressRing value={subject.stats.percentage} size={96} stroke={8} />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm text-fg-muted">
              <span className="font-numbers text-2xl text-fg">{subject.stats.completed}</span>
              <span className="mx-1 text-fg-subtle">/</span>
              <span className="font-numbers text-fg">{subject.stats.total}</span> chapters completed
              {subject.marks > 0 && <span className="text-fg-subtle"> · {subject.marks} preli marks</span>}
            </p>
            <StatusBar segments={statusSegments(counts)} height="h-2.5" />
            <div className="flex flex-wrap gap-2">
              {counts.OVERDUE > 0 && <Badge tone="danger" dot>{counts.OVERDUE} overdue</Badge>}
              {counts.IN_PROGRESS > 0 && <Badge tone="info" dot>{counts.IN_PROGRESS} in progress</Badge>}
              <Badge tone="neutral" dot>{counts.NOT_STARTED} not started</Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Chapters"
          description="Click a chapter to edit it. Drag onto a chapter to move it."
          actions={
            <>
              <SegmentedControl
                ariaLabel="Filter by status"
                value={filter}
                onChange={setFilter}
                segments={STATUS_FILTER_OPTIONS.map((o) => ({
                  ...o,
                  count: o.value === "ALL" ? leaves.length : counts[o.value],
                }))}
              />
              <IconButton
                label={allCollapsed ? "Expand all" : "Collapse all"}
                icon={allCollapsed ? <ChevronsUpDown /> : <ChevronsDownUp />}
                onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(folderIds(subject.children)))}
              />
            </>
          }
        />
        <div className="p-2 sm:p-3">
          {subject.children.length === 0 ? (
            <EmptyState
              icon={<Plus />}
              title="No chapters yet"
              description="Add the first chapter of this subject."
              action={<Button onClick={openCreate}>Add chapter</Button>}
            />
          ) : visible.length === 0 ? (
            <EmptyState icon={<SearchX />} title="No chapters match this filter" />
          ) : (
            <ChapterTree
              nodes={visible}
              numbered={filter === "ALL"}
              collapsed={collapsed}
              onToggle={(id) =>
                setCollapsed((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              onEdit={(node) => setEditor({ mode: "edit", kind: "chapter", row: node.row })}
              onStatusChange={(node, status) => void setStatus(node.row, status)}
              onMove={filter === "ALL" ? move : undefined}
            />
          )}
        </div>
      </Card>

      <ChapterEditor subject={subject} state={editor} onClose={() => setEditor(null)} />
    </div>
  );
}
