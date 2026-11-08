import { useMemo, type ReactNode } from "react";
import { CheckSquare2, Square } from "lucide-react";
import { cn } from "../../lib/cn";
import { parseMarkdown, type Inline, type ListItem } from "../../lib/markdown";

function renderInline(nodes: readonly Inline[], keyPrefix = ""): ReactNode[] {
  return nodes.map((n, i) => {
    const key = `${keyPrefix}${i}`;
    switch (n.t) {
      case "text":
        return n.v;
      case "bold":
        return (
          <strong key={key} className="font-semibold text-fg">
            {renderInline(n.c, `${key}-`)}
          </strong>
        );
      case "italic":
        return <em key={key}>{renderInline(n.c, `${key}-`)}</em>;
      case "code":
        return (
          <code key={key} className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[0.85em] text-fg">
            {n.v}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={n.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {renderInline(n.c, `${key}-`)}
          </a>
        );
    }
  });
}

function ListItems({ items }: { readonly items: readonly ListItem[] }) {
  return items.map((item, i) => (
    <li
      key={i}
      style={item.indent ? { marginLeft: `${item.indent * 1.25}rem` } : undefined}
      className={cn(item.checked !== null && "flex list-none items-start gap-2 -ml-5")}
    >
      {item.checked !== null &&
        (item.checked ? (
          <CheckSquare2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Done" />
        ) : (
          <Square className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-label="Not done" />
        ))}
      <span className={cn(item.checked && "text-fg-subtle line-through")}>{renderInline(item.content)}</span>
    </li>
  ));
}

/** Renders a study note written in the app's Markdown subset. */
export function Markdown({ source, className }: { readonly source: string; readonly className?: string }) {
  const blocks = useMemo(() => parseMarkdown(source), [source]);

  return (
    <div className={cn("space-y-2 text-sm leading-relaxed text-fg-muted wrap-break-word", className)}>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "heading": {
            const size = b.level === 1 ? "text-base" : b.level === 2 ? "text-[15px]" : "text-sm";
            return (
              <p key={i} role="heading" aria-level={b.level + 2} className={cn("pt-1 font-semibold text-fg", size)}>
                {renderInline(b.content)}
              </p>
            );
          }
          case "paragraph":
            return (
              <p key={i}>
                {b.lines.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </span>
                ))}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1 pl-5 marker:text-fg-subtle">
                <ListItems items={b.items} />
              </ul>
            );
          case "ol":
            return (
              <ol key={i} start={b.start} className="list-decimal space-y-1 pl-5 marker:text-fg-subtle">
                <ListItems items={b.items} />
              </ol>
            );
          case "quote":
            return (
              <blockquote key={i} className="border-l-2 border-border-strong pl-3 text-fg-subtle italic">
                {b.lines.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {renderInline(line)}
                  </span>
                ))}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-lg border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed text-fg"
              >
                <code>{b.code}</code>
              </pre>
            );
          case "hr":
            return <hr key={i} className="border-border" />;
        }
      })}
    </div>
  );
}
