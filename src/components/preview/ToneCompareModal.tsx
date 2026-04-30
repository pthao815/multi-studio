"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { BrandVoice, ChannelType } from "@/types";

const TONES: BrandVoice[] = ["energetic", "educational", "funny", "calm"];

interface ToneCompareModalProps {
  projectId: string;
  outputId: string;
  channel: ChannelType;
  initialBrandVoice: BrandVoice;
  onUseVersion: (content: string) => void;
  onClose: () => void;
}

export function ToneCompareModal({
  projectId,
  outputId,
  channel,
  initialBrandVoice,
  onUseVersion,
  onClose,
}: ToneCompareModalProps) {
  // Pre-populate with current brand voice and one adjacent tone
  const currentIndex = TONES.indexOf(initialBrandVoice);
  const adjacentIndex = (currentIndex + 1) % TONES.length;

  const [toneA, setToneA] = useState<BrandVoice>(initialBrandVoice);
  const [toneB, setToneB] = useState<BrandVoice>(TONES[adjacentIndex]);
  const [comparing, setComparing] = useState(false);
  const [contentA, setContentA] = useState("");
  const [contentB, setContentB] = useState("");
  const [hasResults, setHasResults] = useState(false);

  async function handleCompare() {
    setComparing(true);
    setHasResults(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outputId, toneA, toneB }),
      });

      if (!res.ok) {
        toast.error("Comparison failed. Please try again.");
        return;
      }

      const data = await res.json() as { contentA: string; contentB: string };
      setContentA(data.contentA);
      setContentB(data.contentB);
      setHasResults(true);
    } catch {
      toast.error("Comparison failed. Please try again.");
    } finally {
      setComparing(false);
    }
  }

  async function handleUse(content: string) {
    try {
      const res = await fetch(`/api/outputs/${outputId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        onUseVersion(content);
        onClose();
        toast.success("Version saved");
      } else {
        toast.error("Failed to save version.");
      }
    } catch {
      toast.error("Failed to save version.");
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-white">Compare Tones</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate the same {channel} post in two different tones and pick the best one.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-300 text-xl leading-none p-1"
            >
              ×
            </button>
          </div>

          {/* Tone selectors */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Tone A</label>
                <select
                  value={toneA}
                  onChange={(e) => setToneA(e.target.value as BrandVoice)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Tone B</label>
                <select
                  value={toneB}
                  onChange={(e) => setToneB(e.target.value as BrandVoice)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCompare}
              disabled={comparing || toneA === toneB}
              className="w-full py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {comparing ? "Generating both versions…" : "Compare →"}
            </button>

            {toneA === toneB && (
              <p className="text-xs text-amber-400 text-center">Select two different tones to compare.</p>
            )}
          </div>

          {/* Results */}
          {hasResults && (
            <div className="px-6 pb-6 space-y-4">
              <div className="border-t border-slate-700 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ContentColumn
                    label={`Tone A: ${toneA.charAt(0).toUpperCase() + toneA.slice(1)}`}
                    content={contentA}
                    onUse={() => handleUse(contentA)}
                  />
                  <ContentColumn
                    label={`Tone B: ${toneB.charAt(0).toUpperCase() + toneB.slice(1)}`}
                    content={contentB}
                    onUse={() => handleUse(contentB)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ContentColumn({
  label,
  content,
  onUse,
}: {
  label: string;
  content: string;
  onUse: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <textarea
        readOnly
        value={content}
        rows={12}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-200 p-3 resize-none focus:outline-none"
      />
      <button
        onClick={onUse}
        className="w-full py-2 rounded-lg text-sm font-medium bg-green-700 text-white hover:bg-green-600 transition-colors"
      >
        Use This Version
      </button>
    </div>
  );
}
