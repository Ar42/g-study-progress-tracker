import type { StudyDomain } from "../types";

/** Google Sheet tab that backs each study domain. */
export const SHEET_NAME: Record<StudyDomain, string> = {
  BCS: "Sheet1",
  IT: "IT",
};

export const COUNTDOWN_LABEL = "Deadline";

/** Modal close behaviour (kept configurable per the original requirements). */
export const MODAL_CLOSE_ON_ESCAPE = true;
export const MODAL_CLOSE_ON_OUTSIDE_CLICK = false;

/**
 * After a write, wait this long before a background refresh is allowed to
 * replace local data. Prevents a lagging sheet export from "undoing" edits.
 */
export const WRITE_SETTLE_MS = 8_000;

/** Auto-refresh when the tab regains focus if data is older than this. */
export const FOCUS_REFRESH_AFTER_MS = 60_000;

export const AUTH_COOKIE = "auth_session";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
