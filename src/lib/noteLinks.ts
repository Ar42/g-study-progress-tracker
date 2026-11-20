/**
 * Link helpers for Notes files: what kind of link it is, and — for Google
 * Docs / Sheets / Slides / Drive on phones — the URL that opens the Google app
 * instead of the browser.
 */

export type LinkKind = "gdoc" | "gsheet" | "gslide" | "gform" | "gdrive" | "youtube" | "pdf" | "web";

export interface LinkInfo {
  readonly kind: LinkKind;
  readonly label: string;
  /** Hostname without "www.", for display. */
  readonly host: string;
}

const LABEL: Record<LinkKind, string> = {
  gdoc: "Google Docs",
  gsheet: "Google Sheets",
  gslide: "Google Slides",
  gform: "Google Forms",
  gdrive: "Google Drive",
  youtube: "YouTube",
  pdf: "PDF",
  web: "Link",
};

export function parseUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

/** Adds https:// when the user typed "docs.google.com/…" without a scheme. */
export function normalizeLink(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`;
}

export function classifyLink(raw: string): LinkInfo {
  const u = parseUrl(raw);
  if (!u) return { kind: "web", label: LABEL.web, host: "" };
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;
  let kind: LinkKind = "web";
  if (host === "docs.google.com") {
    if (path.startsWith("/document/")) kind = "gdoc";
    else if (path.startsWith("/spreadsheets/")) kind = "gsheet";
    else if (path.startsWith("/presentation/")) kind = "gslide";
    else if (path.startsWith("/forms/")) kind = "gform";
  } else if (host === "drive.google.com") kind = "gdrive";
  else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") kind = "youtube";
  else if (/\.pdf$/i.test(path)) kind = "pdf";
  return { kind, label: LABEL[kind], host };
}

/** Android package + iOS URL scheme of the Google app for each kind. */
const GOOGLE_APPS: Partial<Record<LinkKind, { android: string; ios: string }>> = {
  gdoc: { android: "com.google.android.apps.docs.editors.docs", ios: "googledocs" },
  gsheet: { android: "com.google.android.apps.docs.editors.sheets", ios: "googlesheets" },
  gslide: { android: "com.google.android.apps.docs.editors.slides", ios: "googleslides" },
  gdrive: { android: "com.google.android.apps.docs", ios: "googledrive" },
};

export type MobileOs = "android" | "ios" | null;

export function detectMobileOs(userAgent: string, maxTouchPoints = 0): MobileOs {
  if (/android/i.test(userAgent)) return "android";
  if (/iphone|ipad|ipod/i.test(userAgent)) return "ios";
  // iPadOS reports itself as a Mac; touch support gives it away.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  return null;
}

/**
 * URL that opens the link in the matching Google app on a phone, or null when
 * it should just open in a new tab.
 *  - Android: an intent:// URL with the web link as browser fallback, so it
 *    still opens in the browser when the app isn't installed.
 *  - iOS: the app's custom scheme (googledocs://docs.google.com/…); the caller
 *    falls back to the web link if the app doesn't take over.
 */
export function appLinkFor(raw: string, os: MobileOs): string | null {
  if (!os) return null;
  const u = parseUrl(raw);
  if (!u) return null;
  const app = GOOGLE_APPS[classifyLink(raw).kind];
  if (!app) return null;
  const rest = `${u.host}${u.pathname}${u.search}`;
  if (os === "android") {
    return `intent://${rest}#Intent;scheme=https;package=${app.android};S.browser_fallback_url=${encodeURIComponent(u.toString())};end`;
  }
  return `${app.ios}://${rest}`;
}
