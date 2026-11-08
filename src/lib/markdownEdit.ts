/**
 * Pure text-editing helpers behind the Markdown editor toolbar.
 * Each returns an Edit: replace value[start, end) with `text`, then select
 * [selStart, selEnd) (absolute offsets in the NEW value).
 */
export interface Edit {
  readonly start: number;
  readonly end: number;
  readonly text: string;
  readonly selStart: number;
  readonly selEnd: number;
}

export type LineKind = "h2" | "bullet" | "ordered" | "check" | "quote";

const lineStartOf = (v: string, i: number) => v.lastIndexOf("\n", i - 1) + 1;
const lineEndOf = (v: string, i: number) => {
  const n = v.indexOf("\n", i);
  return n === -1 ? v.length : n;
};

/** Any block prefix we know how to replace (leading spaces kept separately). */
const ANY_PREFIX = /^(#{1,3}\s+|[-*]\s+\[[ xX]\]\s+|[-*]\s+|\d+[.)]\s+|>\s?)/;

/** Toggle inline markers (e.g. "**") around the selection. */
export function wrapEdit(value: string, s: number, e: number, marker: string, placeholder: string): Edit {
  const m = marker.length;
  const sel = value.slice(s, e);
  if (sel && value.slice(s - m, s) === marker && value.slice(e, e + m) === marker) {
    return { start: s - m, end: e + m, text: sel, selStart: s - m, selEnd: e - m };
  }
  if (sel.length > 2 * m && sel.startsWith(marker) && sel.endsWith(marker)) {
    const inner = sel.slice(m, -m);
    return { start: s, end: e, text: inner, selStart: s, selEnd: s + inner.length };
  }
  const body = sel || placeholder;
  return { start: s, end: e, text: `${marker}${body}${marker}`, selStart: s + m, selEnd: s + m + body.length };
}

/** Toggle a line-level prefix (heading, bullet, numbered, checklist, quote) on every selected line. */
export function linePrefixEdit(value: string, s: number, e: number, kind: LineKind): Edit {
  const start = lineStartOf(value, s);
  const end = lineEndOf(value, Math.max(s, e - (e > s && value[e - 1] === "\n" ? 1 : 0)));
  const lines = value.slice(start, end).split("\n");

  const has: Record<LineKind, RegExp> = {
    h2: /^\s*#{1,3}\s+/,
    bullet: /^\s*[-*]\s+(?!\[[ xX]\])/,
    ordered: /^\s*\d+[.)]\s+/,
    check: /^\s*[-*]\s+\[[ xX]\]\s+/,
    quote: /^\s*>\s?/,
  };
  const nonEmpty = lines.filter((l) => l.trim());
  const removing = nonEmpty.length > 0 && nonEmpty.every((l) => has[kind].test(l));

  // On a blank line (e.g. starting a new list) the prefix goes on that line itself.
  const allBlank = nonEmpty.length === 0;
  let n = 0;
  const out = lines.map((line) => {
    if (!line.trim() && !allBlank) return line;
    const lead = line.match(/^\s*/)?.[0] ?? "";
    const body = line.slice(lead.length).replace(ANY_PREFIX, "");
    if (removing) return lead + body;
    n += 1;
    const prefix = { h2: "## ", bullet: "- ", ordered: `${n}. `, check: "- [ ] ", quote: "> " }[kind];
    return lead + prefix + body;
  });
  const text = out.join("\n");
  // Single empty line: put the caret after the new prefix.
  return { start, end, text, selStart: lines.length === 1 ? start + text.length : start, selEnd: start + text.length };
}

/** Wrap the selection as a link and select the URL so it can be pasted over. */
export function linkEdit(value: string, s: number, e: number): Edit {
  const label = value.slice(s, e) || "link text";
  const url = "https://";
  const text = `[${label}](${url})`;
  const urlStart = s + label.length + 3;
  return { start: s, end: e, text, selStart: urlStart, selEnd: urlStart + url.length };
}

const CONTINUE = /^(\s*)([-*]\s+\[[ xX]\]\s+|[-*]\s+|(\d+)([.)])\s+|>\s?)(.*)$/;

/**
 * Enter inside a list/quote line continues it ("- " → next "- ", "3. " → "4. ",
 * checklist → unchecked item). Enter on an empty item ends the list.
 * Returns null when Enter should behave normally.
 */
export function enterEdit(value: string, caret: number): Edit | null {
  const start = lineStartOf(value, caret);
  const line = value.slice(start, lineEndOf(value, caret));
  const m = line.match(CONTINUE);
  if (!m) return null;
  const [, lead, marker, num, punct, rest] = m;
  if (!rest.trim()) {
    // Empty item: remove the marker and end the list.
    return { start, end: start + line.length, text: "", selStart: start, selEnd: start };
  }
  let next = marker;
  if (num !== undefined) next = `${Number(num) + 1}${punct} `;
  else if (/\[[ xX]\]/.test(marker)) next = marker.replace(/\[[xX]\]/, "[ ]");
  const text = `\n${lead}${next}`;
  return { start: caret, end: caret, text, selStart: caret + text.length, selEnd: caret + text.length };
}

/** Tab / Shift+Tab: indent or outdent the selected list lines by two spaces. */
export function indentEdit(value: string, s: number, e: number, outdent: boolean): Edit | null {
  const start = lineStartOf(value, s);
  const end = lineEndOf(value, e);
  const lines = value.slice(start, end).split("\n");
  if (!lines.some((l) => ANY_PREFIX.test(l.trimStart()))) return null;
  const out = lines.map((l) => (outdent ? l.replace(/^ {1,2}/, "") : `  ${l}`));
  const text = out.join("\n");
  return { start, end, text, selStart: start, selEnd: start + text.length };
}
