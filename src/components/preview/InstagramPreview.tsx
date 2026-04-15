"use client";

interface InstagramData {
  slides: string[];
  caption: string;
  hashtags: string[];
}

interface InstagramPreviewProps {
  content: string;
}

export function InstagramPreview({ content }: InstagramPreviewProps) {
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
      {/* Slide count badge */}
      <div className="text-xs text-slate-400">
        {data.slides.length} slides · {data.hashtags.length} hashtags
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
  );
}
