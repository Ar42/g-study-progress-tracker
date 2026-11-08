/**
 * Centralised access to build-time environment variables.
 * Every value has a sane fallback so the app still boots without a .env file.
 */

const DEFAULT_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/16YFBrX2muNuj2NXNDb_YDnlwEJptKEYBnCv0YHiFnuQ/export?format=csv&gid=0";

const DEFAULT_ADMIN_URL =
  "https://script.google.com/macros/s/AKfycbzBao4_TyAme4m-OLT_xOjlO778Ip1QNJX8sOGDiJvaop-9tE_eiRF51O3Bb7VPB63xWg/exec";

const sheetCsvUrl: string = import.meta.env.VITE_SHEET_CSV_URL || DEFAULT_SHEET_CSV_URL;

/** Public CSV URL for a tab by name, derived from the main sheet URL. */
function deriveTabCsvUrl(tab: string): string {
  const match = sheetCsvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) {
    return `https://docs.google.com/spreadsheets/d/${match[1]}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}&headers=1`;
  }
  return sheetCsvUrl.replace(/gid=[^&]+/, `sheet=${encodeURIComponent(tab)}`);
}

function deriveItCsvUrl(): string {
  return (import.meta.env.VITE_IT_SHEET_CSV_URL as string | undefined) || deriveTabCsvUrl("IT");
}

export const env = {
  sheetCsvUrl,
  itSheetCsvUrl: deriveItCsvUrl(),
  logSheetCsvUrl: deriveTabCsvUrl("Study Log"),
  sessionsSheetCsvUrl: deriveTabCsvUrl("Study Sessions"),
  settingsSheetCsvUrl: deriveTabCsvUrl("Settings"),
  adminUrl: (import.meta.env.VITE_ADMIN_URL as string | undefined) || DEFAULT_ADMIN_URL,
  authUsername: (import.meta.env.VITE_AUTH_USERNAME as string | undefined) || "admin",
  authPassword: (import.meta.env.VITE_AUTH_PASSWORD as string | undefined) || "password123",
  /** Optional ISO date (yyyy-mm-dd) used by the dashboard countdown. */
  targetDate: (import.meta.env.VITE_TARGET_DATE as string | undefined) || "2026-12-15",
} as const;
