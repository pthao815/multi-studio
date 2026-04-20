"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Query } from "appwrite";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  account,
  databases,
  DB_ID,
  PROJECTS_COL,
  OUTPUTS_COL,
  SCHEDULES_COL,
} from "@/lib/appwrite";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Project, SourceType } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  processing: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  done: "bg-green-500/20 text-green-400 border border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const SOURCE_ICONS: Record<SourceType, string> = {
  url: "🌐",
  text: "📝",
  audio: "🎙️",
};

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function formatDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [totalOutputs, setTotalOutputs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [sourceFilter, setSourceFilter] = useState<SourceType | "all">("all");
  const [titleSearch, setTitleSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const user = await account.get();
        const [projectsResult, outputsResult] = await Promise.all([
          databases.listDocuments(DB_ID, PROJECTS_COL, [
            Query.equal("userId", user.$id),
            Query.orderDesc("createdAt"),
            Query.limit(100),
          ]),
          databases.listDocuments(DB_ID, OUTPUTS_COL, [
            Query.equal("userId", user.$id),
            Query.limit(1),
          ]),
        ]);
        setProjects(projectsResult.documents as unknown as Project[]);
        setTotalOutputs(outputsResult.total);
      } catch {
        // session error handled by layout redirect
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(e: React.MouseEvent, project: Project) {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Delete "${project.title}"? This cannot be undone.`)) return;

    setDeleting(project.$id);
    try {
      // 1. Fetch all outputs for this project
      const outputsResult = await databases.listDocuments(DB_ID, OUTPUTS_COL, [
        Query.equal("projectId", project.$id),
        Query.limit(100),
      ]);
      const outputIds = outputsResult.documents.map((o) => o.$id);

      // 2. Delete all schedules referencing those output IDs (DEC-08: schedules first)
      if (outputIds.length > 0) {
        const schedulesResult = await databases.listDocuments(DB_ID, SCHEDULES_COL, [
          Query.equal("outputId", outputIds),
          Query.limit(100),
        ]);
        await Promise.all(
          schedulesResult.documents.map((s) =>
            databases.deleteDocument(DB_ID, SCHEDULES_COL, s.$id)
          )
        );
      }

      // 3. Delete all outputs (DEC-08: outputs second)
      await Promise.all(
        outputIds.map((id) => databases.deleteDocument(DB_ID, OUTPUTS_COL, id))
      );

      // 4. Delete the project (DEC-08: project last)
      await databases.deleteDocument(DB_ID, PROJECTS_COL, project.$id);

      setProjects((prev) => prev.filter((p) => p.$id !== project.$id));
      setTotalOutputs((prev) => Math.max(0, prev - outputIds.length));
      toast.success("Project deleted.");
    } catch {
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  const last7Days = useMemo(() => getLast7Days(), []);

  const projectsLast7 = useMemo(
    () =>
      projects.filter((p) => last7Days.includes(p.createdAt.slice(0, 10))).length,
    [projects, last7Days]
  );

  const chartData = useMemo(
    () =>
      last7Days.map((day) => ({
        date: formatDay(day),
        count: projects.filter((p) => p.createdAt.slice(0, 10) === day).length,
      })),
    [projects, last7Days]
  );

  const filtered = useMemo(() => {
    let result = projects;
    if (sourceFilter !== "all") {
      result = result.filter((p) => p.sourceType === sourceFilter);
    }
    if (titleSearch.trim()) {
      const q = titleSearch.trim().toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }
    return result;
  }, [projects, sourceFilter, titleSearch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Your projects and content at a glance.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          + New Project
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Total Projects
          </p>
          <p className="text-3xl font-bold text-white">{projects.length}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Total Outputs
          </p>
          <p className="text-3xl font-bold text-white">{totalOutputs}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Projects (Last 7 Days)
          </p>
          <p className="text-3xl font-bold text-white">{projectsLast7}</p>
        </GlassCard>
      </div>

      {/* Bar chart */}
      <GlassCard padding="md">
        <p className="text-sm font-medium text-slate-300 mb-4">
          Projects created — last 7 days
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                color: "#f1f5f9",
                fontSize: 12,
              }}
              cursor={{ fill: "rgba(139,92,246,0.1)" }}
            />
            <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by title…"
          value={titleSearch}
          onChange={(e) => setTitleSearch(e.target.value)}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
        <div className="flex gap-2">
          {(["all", "url", "text", "audio"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                sourceFilter === f
                  ? "bg-violet-600 text-white"
                  : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.08]"
              }`}
            >
              {f === "all" ? "All" : `${SOURCE_ICONS[f as SourceType]} ${f}`}
            </button>
          ))}
        </div>
      </div>

      {/* Project grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">
            {projects.length === 0
              ? "No projects yet. Create your first one!"
              : "No projects match your filters."}
          </p>
          {projects.length === 0 && (
            <Link
              href="/dashboard/new"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
            >
              Create project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div key={project.$id} className="relative group">
              <Link href={`/dashboard/projects/${project.$id}`}>
                <GlassCard variant="hoverable" padding="md" className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl shrink-0">
                        {SOURCE_ICONS[project.sourceType]}
                      </span>
                      <h3 className="text-sm font-semibold text-white truncate">
                        {project.title}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[project.status]}`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {new Date(project.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </GlassCard>
              </Link>

              {/* Delete button — floats over card, stops link navigation */}
              <button
                onClick={(e) => handleDelete(e, project)}
                disabled={deleting === project.$id}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all disabled:cursor-not-allowed"
                title="Delete project"
              >
                {deleting === project.$id ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
