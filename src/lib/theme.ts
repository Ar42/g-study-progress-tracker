import { create } from "zustand";

export type Theme = "light" | "dark";

const KEY = "gst.theme";

function current(): Theme {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

interface ThemeState {
  readonly theme: Theme;
  readonly toggle: () => void;
}

/** The theme is applied in index.html before paint; this store keeps React in sync. */
export const useTheme = create<ThemeState>((set, get) => ({
  theme: current(),
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — theme still applies for this session */
    }
    set({ theme: next });
  },
}));
