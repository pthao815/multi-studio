"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  outputId: string;
  initialImagePrompt?: string;
}

export function ImagePromptButton({ outputId, initialImagePrompt }: Props) {
  const [imagePrompt, setImagePrompt] = useState(initialImagePrompt ?? "");
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/outputs/${outputId}/image-prompt`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to generate image prompt.");
        return;
      }
      const data = await res.json();
      setImagePrompt(data.imagePrompt);
      toast.success("Image prompt generated.");
    } catch {
      toast.error("Failed to generate image prompt.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          Image Prompt
        </span>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? "Generating…" : imagePrompt ? "Regenerate" : "Generate Image Prompt"}
        </button>
      </div>
      {imagePrompt && (
        <div className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 leading-relaxed">
          {imagePrompt}
        </div>
      )}
    </div>
  );
}
