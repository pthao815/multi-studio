import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// DEC-07: auto-derive project title based on source type
export function deriveTitle(
  sourceType: "url" | "text" | "audio",
  content: string,
  filename?: string
): string {
  if (sourceType === "url") {
    return content.trim() || "Untitled";
  }

  if (sourceType === "text") {
    const words = content.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "Untitled";
    return words.slice(0, 8).join(" ") + (words.length > 8 ? "..." : "");
  }

  // audio
  if (filename) {
    const base = filename.replace(/\.[^.]+$/, "");
    const date = new Date().toISOString().slice(0, 10);
    return `${base} ${date}`;
  }
  return "Audio " + new Date().toISOString().slice(0, 10);
}
