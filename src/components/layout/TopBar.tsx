interface TopBarProps {
  displayName: string;
}

export default function TopBar({ displayName }: TopBarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06] shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold">
          {(displayName || "U").charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium text-slate-300">
          {displayName || "Welcome"}
        </span>
      </div>
    </header>
  );
}
