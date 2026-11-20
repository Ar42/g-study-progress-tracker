import { create } from "zustand";
import { toast } from "sonner";

const CHEERS = [
  "Yahoo! 🎉",
  "Hurray! 🥳",
  "Boom, done! 💥",
  "Nailed it! 🔨",
  "Woohoo! 🙌",
  "One more down! ✅",
  "Crushed it! 💪",
  "Brilliant work! 🌟",
  "That's a wrap! 🎬",
  "Victory! 🏆",
  "Done and dusted! ✨",
  "Way to go! 🚀",
  "Look at you go! 🔥",
  "Another one bites the dust! 🎯",
  "Champion move! 🥇",
] as const;

/** A random celebration toast for a completed chapter / topic. */
export function celebrate(name: string): void {
  const cheer = CHEERS[Math.floor(Math.random() * CHEERS.length)];
  toast.success(cheer, { description: `“${name}” is completed.` });
}

interface CompletionState {
  pending: { name: string; resolve: (ok: boolean) => void } | null;
  ask: (name: string) => Promise<boolean>;
  answer: (ok: boolean) => void;
}

export const useCompletion = create<CompletionState>((set, get) => ({
  pending: null,
  ask: (name) =>
    new Promise<boolean>((resolve) => {
      get().pending?.resolve(false);
      set({ pending: { name, resolve } });
    }),
  answer: (ok) => {
    get().pending?.resolve(ok);
    set({ pending: null });
  },
}));

/** Asks "Mark … as completed?" in the app-wide dialog. Resolves true on confirm. */
export const confirmCompletion = (name: string) => useCompletion.getState().ask(name);

