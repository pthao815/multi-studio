"use client";

import { useState } from "react";
import { toast } from "sonner";

interface LinkedInPreviewProps {
  content: string;
  outputId?: string;
  previousContent?: string;
  onRestored?: (newContent: string) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function LinkedInPreview({ content, outputId, previousContent, onRestored }: LinkedInPreviewProps) {
  const [restoring, setRestoring] = useState(false);
  const wordCount = countWords(content);

  async function handleRestore() {
    if (!outputId || !previousContent) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/outputs/${outputId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: previousContent }),
      });
      if (res.ok) {
        onRestored?.(previousContent);
        toast.success("Restored previous version");
      } else {
        toast.error("Failed to restore.");
      }
    } catch {
      toast.error("Failed to restore.");
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#0A66C2] flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold tracking-tight">in</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">LinkedIn</p>
          <p className="text-xs text-slate-400">Article Post</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500">{wordCount} words</span>
          {previousContent && outputId && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400/60 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
            >
              {restoring ? "Restoring…" : "↩ Restore Previous Version"}
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-700 pt-4">
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}
