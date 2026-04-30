export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded bg-slate-700 shrink-0" />
          <div className="h-3.5 bg-slate-700 rounded flex-1" />
        </div>
        <div className="w-14 h-5 bg-slate-700 rounded-full shrink-0" />
      </div>
      <div className="mt-3 h-3 bg-slate-700/60 rounded w-24" />
    </div>
  );
}
