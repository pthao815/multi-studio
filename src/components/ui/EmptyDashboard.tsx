import Link from "next/link";

interface EmptyDashboardProps {
  filtered?: boolean;
}

export function EmptyDashboard({ filtered = false }: EmptyDashboardProps) {
  if (filtered) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-sm">No projects match your filters.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-violet-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">No projects yet</h3>
      <p className="text-slate-400 text-sm mb-6">
        Create your first project to start generating content across 5 channels.
      </p>
      <Link
        href="/dashboard/new"
        className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
      >
        Create project
      </Link>
    </div>
  );
}
