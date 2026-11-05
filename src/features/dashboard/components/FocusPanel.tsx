import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, PartyPopper } from "lucide-react";
import { Button, Card, CardHeader, ConfirmDialog, EmptyState, SegmentedControl } from "../../../components/ui";
import { ProgressStatus, type DisplayStatus } from "../../../enums/progress";
import { collectLeaves } from "../../../lib/tree";
import type { StudyDomain, StudyRow, Subject, Topic } from "../../../types";
import { ItemDetails } from "../../study/components/ItemDetails";
import { useStudyActions } from "../../study/hooks/useStudyActions";

type Tab = "OVERDUE" | "IN_PROGRESS";

interface FocusItem {
  readonly row: StudyRow;
  readonly status: DisplayStatus;
  readonly domain: StudyDomain;
}

interface FocusGroup {
  readonly key: string;
  readonly title: string;
  readonly href: string;
  readonly items: FocusItem[];
}

function buildGroups(subjects: readonly Subject[], topics: readonly Topic[], status: Tab): FocusGroup[] {
  const groups: FocusGroup[] = subjects
    .map((s) => ({
      key: s.row.id,
      title: s.row.name,
      href: `/subject/${encodeURIComponent(s.row.id)}`,
      items: collectLeaves(s.children)
        .filter((l) => l.status === status)
        .map((l) => ({ row: l.row, status: l.status, domain: "BCS" as const })),
    }))
    .filter((g) => g.items.length > 0);

  const it = topics.filter((t) => t.status === status).map((t) => ({ ...t, domain: "IT" as const }));
  if (it.length > 0) groups.push({ key: "__it", title: "IT", href: "/it", items: it });
  return groups;
}

/** "What should I work on" — overdue and in-progress items across both domains. */
export function FocusPanel({ subjects, topics }: { readonly subjects: readonly Subject[]; readonly topics: readonly Topic[] }) {
  const bcs = useStudyActions("BCS");
  const it = useStudyActions("IT");
  const [confirm, setConfirm] = useState<FocusItem | null>(null);

  const overdue = useMemo(() => buildGroups(subjects, topics, "OVERDUE"), [subjects, topics]);
  const active = useMemo(() => buildGroups(subjects, topics, "IN_PROGRESS"), [subjects, topics]);
  const count = (g: FocusGroup[]) => g.reduce((n, x) => n + x.items.length, 0);

  const [tab, setTab] = useState<Tab | null>(null);
  const current: Tab = tab ?? (count(overdue) > 0 ? "OVERDUE" : "IN_PROGRESS");
  const groups = current === "OVERDUE" ? overdue : active;

  return (
    <Card>
      <CardHeader
        title="Focus"
        description="Chapters you're working on right now"
        actions={
          <SegmentedControl<Tab>
            ariaLabel="Focus filter"
            value={current}
            onChange={setTab}
            segments={[
              { value: "OVERDUE", label: "Overdue", count: count(overdue) },
              { value: "IN_PROGRESS", label: "In progress", count: count(active) },
            ]}
          />
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<PartyPopper />}
          title={current === "OVERDUE" ? "Nothing overdue" : "Nothing in progress"}
          description={
            current === "OVERDUE"
              ? "You're on schedule. Keep it up."
              : "Pick a chapter from a subject and mark it in progress to see it here."
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {groups.map((g) => (
            <section key={g.key} className="px-4 py-3 sm:px-5">
              <Link
                to={g.href}
                className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-fg-subtle hover:text-primary"
              >
                {g.title}
              </Link>
              <ul className="space-y-2">
                {g.items.map((item) => (
                  <li
                    key={item.row.id}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className={item.status === ProgressStatus.OVERDUE ? "text-sm text-danger" : "text-sm text-fg"}>
                        {item.row.name}
                      </p>
                      <ItemDetails row={{ ...item.row, links: [], comments: "" }} status={item.status} />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Check className="size-3.5" />}
                      onClick={() => setConfirm(item)}
                      className="self-end sm:self-auto"
                    >
                      Mark done
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title="Mark as completed?"
        confirmLabel="Mark done"
        message={
          <>
            <span className="font-medium text-fg">{confirm?.row.name}</span> will be marked completed today.
          </>
        }
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            const actions = confirm.domain === "IT" ? it : bcs;
            void actions.setStatus(confirm.row, ProgressStatus.COMPLETED);
          }
          setConfirm(null);
        }}
      />
    </Card>
  );
}
