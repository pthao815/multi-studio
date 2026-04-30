"use client";

import { useState } from "react";
import { toast } from "sonner";

interface InstagramData {
  slides: string[];
  caption: string;
  hashtags: string[];
}

interface InstagramPreviewProps {
  content: string;
  outputId?: string;
  previousContent?: string;
  onRestored?: (newContent: string) => void;
  onContentUpdated?: (newContent: string) => void;
}

export function InstagramPreview({ content, outputId, previousContent, onRestored, onContentUpdated }: InstagramPreviewProps) {
  const [restoring, setRestoring] = useState(false);
  const [refreshingHashtags, setRefreshingHashtags] = useState(false);

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

  async function handleRefreshHashtags() {
    if (!outputId) return;
    setRefreshingHashtags(true);
    try {
      const res = await fetch(`/api/outputs/${outputId}/hashtags`, { method: "POST" });
      if (res.ok) {
        const result = await res.json() as { hashtags: string[] };
        const updated = JSON.stringify({ ...data, hashtags: result.hashtags });
        onContentUpdated?.(updated);
        toast.success("Hashtags refreshed");
      } else {
        toast.error("Failed to refresh hashtags.");
      }
    } catch {
      toast.error("Failed to refresh hashtags.");
    } finally {
      setRefreshingHashtags(false);
    }
  }

  function handleCopyHashtags() {
    if (!data) return;
    const text = data.hashtags.map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
    navigator.clipboard.writeText(text)
      .then(() => toast.success("30 hashtags copied"))
      .catch(() => toast.error("Failed to copy hashtags."));
  }

  let data: InstagramData;
  try {
    data = JSON.parse(content) as InstagramData;
  } catch {
    return (
      <div className="rounded-xl border border-red-800 bg-red-900/20 p-5 text-sm text-red-400">
        Could not parse Instagram content. The generated JSON may be malformed.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Slide count badge + restore */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {data.slides.length} slides · {data.hashtags.length} hashtags
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

      {/* Scrollable slide row */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {data.slides.map((slide, i) => (
          <div
            key={i}
            className="shrink-0 w-48 h-48 rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex flex-col"
          >
            <span className="text-xs font-bold text-indigo-400 mb-2">
              Slide {i + 1}
            </span>
            <p className="text-xs text-slate-200 leading-relaxed overflow-hidden line-clamp-6">
              {slide}
            </p>
          </div>
        ))}
      </div>

      {/* Caption */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Caption</p>
        <p className="text-sm text-slate-200">{data.caption}</p>
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Hashtags ({data.hashtags.length})
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHashtags}
              className="text-xs text-slate-400 hover:text-slate-300 border border-slate-700 hover:border-slate-600 px-2 py-0.5 rounded-lg transition-colors"
            >
              Copy all
            </button>
            {outputId && (
              <button
                onClick={handleRefreshHashtags}
                disabled={refreshingHashtags}
                className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800/50 hover:border-indigo-700 px-2 py-0.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {refreshingHashtags ? "Refreshing…" : "Refresh Hashtags"}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.hashtags.map((tag, i) => (
            <span
              key={i}
              className="text-xs text-indigo-400 bg-indigo-900/30 border border-indigo-800/50 rounded-full px-2 py-0.5"
            >
              {tag.startsWith("#") ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
