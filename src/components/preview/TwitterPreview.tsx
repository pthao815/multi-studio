"use client";

import { useState } from "react";
import { toast } from "sonner";

interface TwitterPreviewProps {
  content: string;
  outputId?: string;
  previousContent?: string;
  onRestored?: (newContent: string) => void;
}

function parseTweets(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function TwitterPreview({ content, outputId, previousContent, onRestored }: TwitterPreviewProps) {
  const [restoring, setRestoring] = useState(false);
  const tweets = parseTweets(content);

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
      {previousContent && outputId && (
        <div className="flex justify-end">
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="text-xs text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400/60 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {restoring ? "Restoring…" : "↩ Restore Previous Version"}
          </button>
        </div>
      )}

      {tweets.map((tweet, i) => (
        <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">𝕏</span>
              </div>
              <span className="text-xs text-slate-400">
                Tweet {i + 1}/{tweets.length}
              </span>
            </div>
            <span
              className={`text-xs font-mono ${
                tweet.length > 280 ? "text-red-400" : "text-slate-500"
              }`}
            >
              {tweet.length}/280
            </span>
          </div>
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {tweet}
          </p>
        </div>
      ))}
    </div>
  );
}
