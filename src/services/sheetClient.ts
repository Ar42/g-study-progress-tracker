import { env } from "../config/env";
import { SHEET_NAME } from "../config/constants";
import type { StudyDomain } from "../types";
import { rowsFromCsv, rowsFromTable } from "./rowMapper";
import type { StudyRow } from "../types";
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

async function readViaScript(domain: StudyDomain): Promise<StudyRow[] | null> {
  if (scriptReadSupported === false) return null;
  try {
    const url = `${env.adminUrl}?action=read&sheet=${encodeURIComponent(SHEET_NAME[domain])}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as { status?: string; rows?: string[][]; message?: string };
    if (!Array.isArray(json.rows)) {
      markUnsupported();
      return null;
    }
    scriptReadSupported = true;
    return rowsFromTable(json.rows);
  } catch {
    if (scriptReadSupported === null) markUnsupported();
    return null;
  }
}

async function readViaCsv(domain: StudyDomain): Promise<StudyRow[]> {
  const base = domain === "IT" ? env.itSheetCsvUrl : env.sheetCsvUrl;
  const url = `${base}${base.includes("?") ? "&" : "?"}_ts=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Google Sheets responded with ${res.status}.`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error("Sheet is not publicly readable (got an HTML page instead of CSV).");
  }
  return rowsFromCsv(text);
}

export async function readRows(domain: StudyDomain): Promise<StudyRow[]> {
  return (await readViaScript(domain)) ?? (await readViaCsv(domain));
}

/* ----------------------------------------------------------------- writes */

export type WriteAction = "CREATE" | "UPDATE" | "DELETE" | "SWAP";

interface ScriptResponse {
  readonly status: "success" | "error";
  readonly message?: string;
}

/**
 * Writes are serialised: Apps Script runs requests concurrently, and the
 * deployed script has no lock, so parallel CREATEs could land on the same row.
 */
let queue: Promise<unknown> = Promise.resolve();

async function post(action: WriteAction, domain: StudyDomain, payload: Record<string, unknown>) {
  const sheetName = SHEET_NAME[domain];
  const res = await fetch(env.adminUrl, {
    method: "POST",
    // text/plain avoids a CORS preflight, which Apps Script cannot answer.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    // Lets the request finish even if the page reloads or closes mid-save,
    // so there's no need for a "changes may not be saved" prompt.
    keepalive: true,
    body: JSON.stringify({ action, domain, sheetName, payload: { ...payload, domain, sheetName } }),
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
  domain: StudyDomain,
  payload: Record<string, unknown>,
): Promise<ScriptResponse> {
  const sync = useSyncStatus.getState();
  sync.beginWrite();
  const run = queue.then(() => post(action, domain, payload));
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
