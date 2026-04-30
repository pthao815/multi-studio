"use client";

import { useState } from "react";
import { toast } from "sonner";

interface FacebookPreviewProps {
  content: string;
  outputId?: string;
  previousContent?: string;
  onRestored?: (newContent: string) => void;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function FacebookPreview({ content, outputId, previousContent, onRestored }: FacebookPreviewProps) {
  const [restoring, setRestoring] = useState(false);
  const charCount = content.length;
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
    <div className="space-y-3">
      {/* Count badge + restore */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-slate-400">
          <span>{charCount.toLocaleString()} characters</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
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

      {/* Post card mockup */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        {/* Fake profile row */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            P
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">Your Page</p>
            <p className="text-xs text-slate-500">Just now · 🌐</p>
          </div>
        </div>

        {/* Post content */}
        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>
    </div>
  );
}
