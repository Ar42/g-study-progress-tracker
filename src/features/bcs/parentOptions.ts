import type { Subject, TreeNode } from "../../types";

/** Flattens the subject tree into "where can this chapter live" options. */
export function buildParentOptions(subject: Subject, editingId: string | null) {
  const options = [{ value: subject.row.id, label: `${subject.row.name} (top level)` }];
  const walk = (nodes: readonly TreeNode[], depth: number) => {
    for (const n of nodes) {
      if (n.row.id === editingId) continue; // can't nest under itself or its descendants
      options.push({ value: n.row.id, label: `${"— ".repeat(depth)}${n.row.name}` });
      walk(n.children, depth + 1);
    }
  };
  walk(subject.children, 1);
  return options;
}

