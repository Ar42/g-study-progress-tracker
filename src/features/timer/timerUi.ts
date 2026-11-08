import { create } from "zustand";
import type { TopicChoice } from "../study/hooks/useTopicChoice";

/** Which timer dialog is open. Rendered once in AppShell, opened from anywhere. */
export type TimerDialog =
  | { readonly kind: "start"; readonly preset?: TopicChoice }
  | { readonly kind: "edit" }
  | { readonly kind: "finish" }
  | { readonly kind: "busy" }
  | null;

interface TimerUiState {
  readonly dialog: TimerDialog;
  readonly open: (d: Exclude<TimerDialog, null>) => void;
  readonly close: () => void;
}

export const useTimerUi = create<TimerUiState>((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
}));
