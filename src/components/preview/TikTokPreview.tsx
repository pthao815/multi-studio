"use client";

interface TikTokPreviewProps {
  content: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Split content into segments: scene labels vs body text
function parseSegments(content: string): { type: "label" | "text"; value: string }[] {
  const parts = content.split(/(\[Scene\s+\d+\])/gi);
  return parts
    .filter((p) => p.trim().length > 0)
    .map((p) => ({
      type: /^\[Scene\s+\d+\]/i.test(p) ? "label" : "text",
      value: p,
    }));
}

export function TikTokPreview({ content }: TikTokPreviewProps) {
  const charCount = content.length;
  const wordCount = countWords(content);
  const segments = parseSegments(content);

  return (
    <div className="space-y-3">
      {/* Count badge */}
      <div className="flex gap-3 text-xs text-slate-400">
        <span>{charCount.toLocaleString()} characters</span>
        <span>·</span>
        <span>{wordCount.toLocaleString()} words</span>
      </div>

      {/* Script card */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-5">
        {/* Fake header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-pink-500 to-cyan-400" />
          <span className="text-sm font-semibold text-slate-200">TikTok Script</span>
        </div>

        {/* Segmented content */}
        <div className="text-sm leading-relaxed space-y-1">
          {segments.map((seg, i) =>
            seg.type === "label" ? (
              <span
                key={i}
                className="inline-block font-bold text-pink-400 mr-1"
              >
                {seg.value}
              </span>
            ) : (
              <span key={i} className="text-slate-200 whitespace-pre-wrap">
                {seg.value}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
