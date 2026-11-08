/**
 * Splits user-typed text into clean item names.
 *
 * - Splits on the given separator (literal text, not a regex) AND on new lines,
 *   so a pasted one-per-line list works too. `\t` in the separator means a tab.
 * - Trims each item and collapses runs of whitespace inside it to one space:
 *   "chapter1 ,     chapter2" → ["chapter1", "chapter2"]
 * - Drops empty items (",,", trailing separators, blank lines).
 * - Removes exact duplicates (case-insensitive), keeping the first.
 */
export function splitList(text: string, separator: string): string[] {
  const sep = separator.replace(/\\t/g, "\t");
  const lines = text.split(/\r?\n/);
  const parts = sep ? lines.flatMap((line) => line.split(sep)) : lines;

  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const name = part.replace(/\s+/g, " ").trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}
