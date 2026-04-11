"use client";

import { Link2, FileText, Mic } from "lucide-react";

export type SourceType = "url" | "text" | "audio";

interface SourceTypeSelectorProps {
  value: SourceType;
  onChange: (type: SourceType) => void;
}

const options: { type: SourceType; label: string; icon: React.ReactNode }[] = [
  { type: "url", label: "URL", icon: <Link2 className="w-4 h-4" /> },
  { type: "text", label: "Text", icon: <FileText className="w-4 h-4" /> },
  { type: "audio", label: "Audio", icon: <Mic className="w-4 h-4" /> },
];

export function SourceTypeSelector({ value, onChange }: SourceTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map(({ type, label, icon }) => {
        const active = value === type;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={
              active
                ? "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-violet-500/50 bg-violet-500/10 text-violet-300 text-sm font-medium"
                : "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/5 text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all duration-150 text-sm font-medium"
            }
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}
