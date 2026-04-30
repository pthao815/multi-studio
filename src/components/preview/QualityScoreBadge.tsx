"use client";

import { useState } from "react";

interface QualityScoreData {
  total: number;
  hook: number;
  cta: number;
  platformFit: number;
  brandAlignment: number;
  tip: string;
}

interface QualityScoreBadgeProps {
  qualityScore?: string;
  loading?: boolean;
}

export function QualityScoreBadge({ qualityScore, loading }: QualityScoreBadgeProps) {
  const [open, setOpen] = useState(false);

  let data: QualityScoreData | null = null;
  if (qualityScore) {
    try {
      data = JSON.parse(qualityScore) as QualityScoreData;
    } catch {
      // Render placeholder
    }
  }

  const size = 56;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const total = data?.total ?? 0;
  const offset = circumference - (total / 100) * circumference;

  function strokeColor(score: number) {
    if (score >= 80) return "#22c55e"; // green-500
    if (score >= 60) return "#fbbf24"; // amber-400
    return "#ef4444";                  // red-500
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-0.5" title="Calculating score…">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="animate-spin">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#334155" strokeWidth={5} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#6366f1"
            strokeWidth={5}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.75}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="text-[10px] text-slate-500 leading-none">Score</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Quality score — click for details"
        className="flex flex-col items-center gap-0.5 group"
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={5}
          />
          {/* Progress */}
          {data && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={strokeColor(total)}
              strokeWidth={5}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
          {/* Score label */}
          <text
            x={size / 2}
            y={size / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={data ? 14 : 12}
            fontWeight="600"
            fill={data ? strokeColor(total) : "#64748b"}
          >
            {data ? total : "—"}
          </text>
        </svg>
        <span className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors leading-none">
          Score
        </span>
      </button>

      {open && data && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Popover */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Quality breakdown</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <ScoreRow label="Hook" value={data.hook} />
              <ScoreRow label="CTA" value={data.cta} />
              <ScoreRow label="Platform fit" value={data.platformFit} />
              <ScoreRow label="Brand alignment" value={data.brandAlignment} />
            </div>

            <div className="border-t border-slate-700 pt-3">
              <p className="text-xs font-medium text-slate-400 mb-1">Improvement tip</p>
              <p className="text-xs text-slate-300 leading-relaxed">{data.tip}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  function color(v: number) {
    if (v >= 20) return "text-green-400";
    if (v >= 15) return "text-amber-400";
    return "text-red-400";
  }

  return (
    <>
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold text-right ${color(value)}`}>{value}/25</span>
    </>
  );
}
