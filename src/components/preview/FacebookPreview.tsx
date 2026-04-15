"use client";

interface FacebookPreviewProps {
  content: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function FacebookPreview({ content }: FacebookPreviewProps) {
  const charCount = content.length;
  const wordCount = countWords(content);

  return (
    <div className="space-y-3">
      {/* Count badge */}
      <div className="flex gap-3 text-xs text-slate-400">
        <span>{charCount.toLocaleString()} characters</span>
        <span>·</span>
        <span>{wordCount.toLocaleString()} words</span>
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
