import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { TIMER_SCRIPT_VERSION } from "../../../config/constants";
import { useGetSettingsQuery, useSaveSettingsMutation } from "../../../services/studyApi";
import { DEFAULT_SETTINGS, resolveSettings, type SettingKey } from "../../../services/settingsMapper";
import { useSyncStatus } from "../../../services/syncStatus";

/** Study-time targets + the long-session threshold, synced via the "Settings" tab. */
export function useSettings() {
  const { data, isLoading } = useGetSettingsQuery();
  const [saveSettings] = useSaveSettingsMutation();
  const scriptVersion = useSyncStatus((s) => s.scriptVersion);

  const settings = useMemo(() => (data ? resolveSettings(data.values) : DEFAULT_SETTINGS), [data]);
  const writable = (scriptVersion ?? 0) >= TIMER_SCRIPT_VERSION;

  const save = useCallback(
    async (changes: Partial<Record<SettingKey, number>>) => {
      try {
        await saveSettings(changes).unwrap();
        toast.success("Targets saved");
        return true;
      } catch (e) {
        const msg = typeof e === "object" && e && "message" in e ? String(e.message) : "Couldn't save to Google Sheet.";
        toast.error("Couldn't save targets", { description: msg });
        return false;
      }
    },
    [saveSettings],
  );

  return { settings, isLoading, writable, save };
}
