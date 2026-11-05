import { Moon, Sun } from "lucide-react";
import { IconButton } from "../components/ui";
import { useTheme } from "../lib/theme";

export function ThemeToggle({ className }: { readonly className?: string }) {
  const { theme, toggle } = useTheme();
  const toLight = theme === "dark";
  return (
    <IconButton
      label={toLight ? "Switch to light mode" : "Switch to dark mode"}
      icon={toLight ? <Sun /> : <Moon />}
      onClick={toggle}
      className={className}
    />
  );
}
