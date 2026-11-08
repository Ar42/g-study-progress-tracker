import { env } from "../config/env";
import { SHEET_NAME, type SheetKey } from "../config/constants";
import { parseCsv } from "../lib/csv";
import { useSyncStatus } from "./syncStatus";

/* ------------------------------------------------------------------ reads */

/**
 * Newer Code.gs versions expose `doGet?action=read`, which reads straight from
 * the spreadsheet (always fresh). Older deployments don't, so we detect that
 * once and fall back to the public CSV export.
 */
const PROBE_KEY = "gst.scriptRead.unsupportedAt";
const PROBE_TTL_MS = 6 * 60 * 60 * 1000; // re-check every 6h, so a redeploy is picked up

function probeSaysUnsupported(): boolean {
  try {
    const at = Number(localStorage.getItem(PROBE_KEY));
    return Boolean(at) && Date.now() - at < PROBE_TTL_MS;
  } catch {
    return false;
  }
}

let scriptReadSupported: boolean | null = probeSaysUnsupported() ? false : null;

function markUnsupported() {
  scriptReadSupported = false;
  try {
    localStorage.setItem(PROBE_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — fine, we just probe again next load */
  }
}

/** Raw sheet table: header row first. `missing` is true when the tab doesn't exist yet. */
export interface SheetTable {
  readonly rows: string[][];
  readonly missing: boolean;
}

interface ReadResponse {
  readonly status?: string;
  readonly rows?: string[][];
  readonly missing?: boolean;
  readonly version?: number;
  readonly message?: string;
}

async function readViaScript(key: SheetKey): Promise<SheetTable | null> {
  if (scriptReadSupported === false) return null;
  let json: ReadResponse;
  try {
    const url = `${env.adminUrl}?action=read&sheet=${encodeURIComponent(SHEET_NAME[key])}`;
    const res = await fetch(url, { cache: "no-store" });
    json = (await res.json()) as ReadResponse;
  } catch {
    if (scriptReadSupported === null) markUnsupported();
    return null;
  }
  // v1 reports "Sheet not found" as an error; v2 reports `missing: true`.
  if (json.status === "error") {
    if (/not found/i.test(json.message ?? "")) {
      useSyncStatus.getState().setScriptVersion(json.version ?? 1);
      return { rows: [], missing: true };
    }
    throw new Error(json.message?.replace(/^Error:\s*/, "") || "Couldn't read the sheet.");
  }
  if (!Array.isArray(json.rows)) {
    markUnsupported();
    return null;
  }
  scriptReadSupported = true;
  useSyncStatus.getState().setScriptVersion(json.version ?? 1);
  return { rows: json.rows, missing: Boolean(json.missing) };
}

const CSV_URL: Record<SheetKey, () => string> = {
  BCS: () => env.sheetCsvUrl,
  IT: () => env.itSheetCsvUrl,
  LOG: () => env.logSheetCsvUrl,
  SESSIONS: () => env.sessionsSheetCsvUrl,
  SETTINGS: () => env.settingsSheetCsvUrl,
};

async function readViaCsv(key: SheetKey): Promise<SheetTable> {
  const base = CSV_URL[key]();
  const url = `${base}${base.includes("?") ? "&" : "?"}_ts=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google Sheets responded with ${res.status}.`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error("Sheet is not publicly readable (got an HTML page instead of CSV).");
  }
  return { rows: parseCsv(text), missing: false };
}

export async function readTable(key: SheetKey): Promise<SheetTable> {
  return (await readViaScript(key)) ?? (await readViaCsv(key));
}

/* ----------------------------------------------------------------- writes */

export type WriteAction = "CREATE" | "UPDATE" | "DELETE" | "SWAP";

interface ScriptResponse {
  readonly status: "success" | "error";
  readonly message?: string;
}

/**
 * Writes are serialised: Apps Script runs requests concurrently, so parallel
 * CREATEs could otherwise race for the same row.
 */
let queue: Promise<unknown> = Promise.resolve();

async function post(action: WriteAction, key: SheetKey, payload: Record<string, unknown>) {
  const sheetName = SHEET_NAME[key];
  const res = await fetch(env.adminUrl, {
    method: "POST",
    // text/plain avoids a CORS preflight, which Apps Script cannot answer.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    // Lets the request finish even if the page reloads or closes mid-save,
    // so there's no need for a "changes may not be saved" prompt.
    keepalive: true,
    body: JSON.stringify({ action, domain: key, sheetName, payload: { ...payload, domain: key, sheetName } }),
  });
  if (!res.ok) throw new Error(`Apps Script responded with ${res.status}.`);
  const json = (await res.json()) as ScriptResponse;
  if (json.status !== "success") {
    throw new Error(json.message?.replace(/^Error:\s*/, "") || "Google Sheet rejected the change.");
  }
  return json;
}

export function writeRow(
  action: WriteAction,
  key: SheetKey,
  payload: Record<string, unknown>,
): Promise<ScriptResponse> {
  const sync = useSyncStatus.getState();
  sync.beginWrite();
  const run = queue.then(() => post(action, key, payload));
  queue = run.catch(() => undefined);
  return run.then(
    (r) => {
      useSyncStatus.getState().endWrite();
      return r;
    },
    (e: unknown) => {
      const message = e instanceof Error ? e.message : "Failed to save to Google Sheet.";
      useSyncStatus.getState().endWrite(message);
      throw new Error(message);
    },
  );
}
