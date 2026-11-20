import type { MouseEvent, ReactNode } from "react";
import { appLinkFor, detectMobileOs } from "../../../lib/noteLinks";

/** How long to wait for the Google app before falling back to the browser (iOS). */
const APP_FALLBACK_MS = 1500;

function openInApp(appUrl: string, webUrl: string, os: "android" | "ios") {
  if (os === "android") {
    // intent:// carries its own browser fallback when the app isn't installed.
    window.location.href = appUrl;
    return;
  }
  // iOS: try the app's scheme; if the page is still visible afterwards, the app
  // isn't installed (or didn't take over) — open the normal link instead.
  const timer = window.setTimeout(() => {
    if (document.visibilityState === "visible") window.location.href = webUrl;
  }, APP_FALLBACK_MS);
  const cancel = () => {
    if (document.visibilityState === "hidden") window.clearTimeout(timer);
  };
  document.addEventListener("visibilitychange", cancel, { once: true });
  window.location.href = appUrl;
}

export interface NoteLinkProps {
  readonly href: string;
  readonly className?: string;
  readonly title?: string;
  readonly children: ReactNode;
}

/**
 * A link that opens in a new tab — except Google Docs / Sheets / Slides / Drive
 * on a phone, which open straight in the matching Google app. Ctrl/⌘/middle
 * click keep normal browser behaviour.
 */
export function NoteLink({ href, className, title, children }: NoteLinkProps) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const os = detectMobileOs(navigator.userAgent, navigator.maxTouchPoints);
    const appUrl = appLinkFor(href, os);
    if (!appUrl || !os) return; // desktop or non-Google link: let target=_blank do its job
    e.preventDefault();
    openInApp(appUrl, href, os);
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className} title={title}>
      {children}
    </a>
  );
}
