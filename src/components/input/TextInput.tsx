"use client";

interface TextInputProps {
  value: string;
  onContentChange: (text: string) => void;
  disabled?: boolean;
}

export function TextInput({ value, onContentChange, disabled }: TextInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Paste your article, blog post, or any text content here…"
        disabled={disabled}
        rows={8}
        className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-150 resize-none min-h-[160px] disabled:opacity-50"
      />
      <p className="text-right font-mono text-xs text-slate-400">
        {value.length.toLocaleString()} characters
      </p>
    </div>
  );
}
