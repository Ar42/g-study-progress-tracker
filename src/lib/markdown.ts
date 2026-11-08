/**
 * A small Markdown subset for study notes — enough for headings, lists,
 * checklists, quotes, code and links, and deliberately nothing more.
 * Parsed into plain data; rendered to React elements (never raw HTML).
 */

export type Inline =
  | { readonly t: "text"; readonly v: string }
  | { readonly t: "bold"; readonly c: Inline[] }
  | { readonly t: "italic"; readonly c: Inline[] }
  | { readonly t: "code"; readonly v: string }
  | { readonly t: "link"; readonly href: string; readonly c: Inline[] };

export interface ListItem {
  readonly indent: number;
  /** null = normal item, boolean = checklist item */
  readonly checked: boolean | null;
  readonly content: Inline[];
}

export type Block =
  | { readonly t: "heading"; readonly level: 1 | 2 | 3; readonly content: Inline[] }
  | { readonly t: "paragraph"; readonly lines: Inline[][] }
  | { readonly t: "ul"; readonly items: ListItem[] }
  | { readonly t: "ol"; readonly start: number; readonly items: ListItem[] }
  | { readonly t: "quote"; readonly lines: Inline[][] }
  | { readonly t: "code"; readonly code: string }
  | { readonly t: "hr" };

const INLINE_RE =
  /`([^`]+)`|\*\*(.+?)\*\*|\*([^*\s](?:[^*]*[^*\s])?)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of src.matchAll(INLINE_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ t: "text", v: src.slice(last, i) });
    if (m[1] !== undefined) out.push({ t: "code", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "bold", c: parseInline(m[2]) });
    else if (m[3] !== undefined) out.push({ t: "italic", c: parseInline(m[3]) });
    else if (m[4] !== undefined && m[5] !== undefined) out.push({ t: "link", href: m[5], c: parseInline(m[4]) });
    else if (m[6] !== undefined) out.push({ t: "link", href: m[6], c: [{ t: "text", v: m[6] }] });
    last = i + m[0].length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

const HEADING = /^(#{1,3})\s+(.*)$/;
const CHECK = /^(\s*)[-*]\s+\[( |x|X)\]\s+(.*)$/;
const BULLET = /^(\s*)[-*]\s+(.*)$/;
const ORDERED = /^(\s*)(\d+)[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^\s*(-{3,}|\*{3,})\s*$/;
const FENCE = /^\s*```/;

const indentOf = (spaces: string) => Math.min(3, Math.floor(spaces.replace(/\t/g, "  ").length / 2));

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: Inline[][] = [];

  const flushPara = () => {
    if (para.length) blocks.push({ t: "paragraph", lines: para });
    para = [];
  };
  const lastBlock = () => blocks[blocks.length - 1];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (FENCE.test(line)) {
      flushPara();
      const code: string[] = [];
      for (i++; i < lines.length && !FENCE.test(lines[i]); i++) code.push(lines[i]);
      blocks.push({ t: "code", code: code.join("\n") });
      continue;
    }
    if (!line.trim()) {
      flushPara();
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = line.match(HEADING))) {
      flushPara();
      blocks.push({ t: "heading", level: m[1].length as 1 | 2 | 3, content: parseInline(m[2]) });
    } else if (RULE.test(line)) {
      flushPara();
      blocks.push({ t: "hr" });
    } else if ((m = line.match(CHECK)) || (m = line.match(BULLET))) {
      flushPara();
      const isCheck = m.length === 4;
      const item: ListItem = {
        indent: indentOf(m[1]),
        checked: isCheck ? m[2].toLowerCase() === "x" : null,
        content: parseInline(isCheck ? m[3] : m[2]),
      };
      const prev = lastBlock();
      if (prev?.t === "ul") prev.items.push(item);
      else blocks.push({ t: "ul", items: [item] });
    } else if ((m = line.match(ORDERED))) {
      flushPara();
      const item: ListItem = { indent: indentOf(m[1]), checked: null, content: parseInline(m[3]) };
      const prev = lastBlock();
      if (prev?.t === "ol") prev.items.push(item);
      else blocks.push({ t: "ol", start: Number(m[2]) || 1, items: [item] });
    } else if ((m = line.match(QUOTE))) {
      flushPara();
      const prev = lastBlock();
      if (prev?.t === "quote") prev.lines.push(parseInline(m[1]));
      else blocks.push({ t: "quote", lines: [parseInline(m[1])] });
    } else {
      para.push(parseInline(line.trim()));
    }
  }
  flushPara();
  return blocks;
}

/** Plain-text version (for search and one-line previews). */
export function markdownToText(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*(#{1,3}|[-*]\s+\[[ xX]\]|[-*]|\d+[.)]|>)\s+/gm, "")
    .replace(/[*`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
