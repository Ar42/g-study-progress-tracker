import type { StudyDomain } from "../types";

/** Every sheet tab the app talks to. */
export type SheetKey = StudyDomain | "LOG" | "SESSIONS" | "SETTINGS";

/** Google Sheet tab that backs each key. */
export const SHEET_NAME: Record<SheetKey, string> = {
  BCS: "Sheet1",
  IT: "IT",
  LOG: "Study Log",
  SESSIONS: "Study Sessions",
  SETTINGS: "Settings",
};

/**
 * Code.gs version the app needs for every feature. v2 adds the Study Log
 * (generic column writes + auto-created tab). The read endpoint reports it.
 */
export const REQUIRED_SCRIPT_VERSION = 2;

/** Code.gs v3 adds the study timer ("Study Sessions") and targets ("Settings"). */
export const TIMER_SCRIPT_VERSION = 3;

/** Default: ask to confirm sessions longer than this when finishing (minutes). */
export const DEFAULT_CONFIRM_OVER_MINUTES = 240;

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
