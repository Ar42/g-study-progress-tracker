import { DEFAULT_CONFIRM_OVER_MINUTES } from "../config/constants";
import { normalizeHeader } from "../lib/csv";
import type { StudySettings } from "../types";

/** "Settings" tab is key/value: Id = setting name, Value = its value. */
export type SettingKey = keyof StudySettings;

export const SETTING_KEYS: readonly SettingKey[] = ["dailyTargetMinutes", "weeklyTargetMinutes", "confirmSessionOverMinutes"];

export const DEFAULT_SETTINGS: StudySettings = {
  dailyTargetMinutes: 0,
  weeklyTargetMinutes: 0,
  confirmSessionOverMinutes: DEFAULT_CONFIRM_OVER_MINUTES,
};

/** Raw key → value strings, exactly as stored. */
export function settingsFromTable(table: readonly (readonly string[])[]): Record<string, string> {
  if (table.length === 0) return {};
  const headers = table[0].map(normalizeHeader);
  const id = headers.indexOf("id");
  const value = headers.indexOf("value");
  if (id === -1 || value === -1) throw new Error("The “Settings” tab is missing or its header row doesn't match.");
  const out: Record<string, string> = {};
  for (const cells of table.slice(1)) {
    const key = (cells[id] ?? "").trim();
    if (key) out[key] = (cells[value] ?? "").trim();
  }
  return out;
}

export function resolveSettings(raw: Record<string, string>): StudySettings {
  const num = (k: SettingKey) => {
    const n = Number(raw[k]);
    return raw[k] !== undefined && raw[k] !== "" && Number.isFinite(n) && n >= 0 ? n : DEFAULT_SETTINGS[k];
  };
  return {
    dailyTargetMinutes: num("dailyTargetMinutes"),
    weeklyTargetMinutes: num("weeklyTargetMinutes"),
    confirmSessionOverMinutes: num("confirmSessionOverMinutes") || DEFAULT_CONFIRM_OVER_MINUTES,
  };
}
