import { FileSpreadsheet, FileText, Folder, HardDrive, Link2, ListChecks, Presentation, CirclePlay, FileType2 } from "lucide-react";
import { cn } from "../../../lib/cn";
import { classifyLink, type LinkKind } from "../../../lib/noteLinks";

const ICON: Record<LinkKind, { icon: typeof Link2; color: string }> = {
  gdoc: { icon: FileText, color: "text-[#4285F4]" },
  gsheet: { icon: FileSpreadsheet, color: "text-[#0F9D58]" },
  gslide: { icon: Presentation, color: "text-[#F4B400]" },
  gform: { icon: ListChecks, color: "text-[#7248B9]" },
  gdrive: { icon: HardDrive, color: "text-fg-muted" },
  youtube: { icon: CirclePlay, color: "text-[#FF0000]" },
  pdf: { icon: FileType2, color: "text-danger" },
  web: { icon: Link2, color: "text-fg-muted" },
};

/** Folder icon, or an icon for the kind of link (Docs, Sheets, YouTube, PDF…). */
export function NoteIcon({ type, link, className }: { readonly type: "FOLDER" | "FILE"; readonly link?: string; readonly className?: string }) {
  if (type === "FOLDER") return <Folder className={cn("size-5 shrink-0 fill-primary/15 text-primary", className)} aria-hidden />;
  const { icon: Icon, color } = ICON[classifyLink(link ?? "").kind];
  return <Icon className={cn("size-5 shrink-0", color, className)} aria-hidden />;
}
