"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Query } from "appwrite";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProjectCardSkeleton } from "@/components/ui/ProjectCardSkeleton";
import { EmptyDashboard } from "@/components/ui/EmptyDashboard";
import type { Project, Output, SourceType } from "@/types";

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

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#3b82f6",
  tiktok: "#f472b6",
  instagram: "#ec4899",
  linkedin: "#0ea5e9",
  twitter: "#94a3b8",
};

const SOURCE_PIE_COLORS = ["#7c3aed", "#0ea5e9", "#ec4899"];

function getLast28Days(): string[] {
  const days: string[] = [];
  for (let i = 27; i >= 0; i--) {
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
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);

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
            Query.limit(500),
          ]),
        ]);
        setProjects(projectsResult.documents as unknown as Project[]);
        setOutputs(outputsResult.documents as unknown as Output[]);
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
      const outputsResult = await databases.listDocuments(DB_ID, OUTPUTS_COL, [
        Query.equal("projectId", project.$id),
        Query.limit(100),
      ]);
      const outputIds = outputsResult.documents.map((o) => o.$id);

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

      await Promise.all(
        outputIds.map((id) => databases.deleteDocument(DB_ID, OUTPUTS_COL, id))
      );
      await databases.deleteDocument(DB_ID, PROJECTS_COL, project.$id);

      setProjects((prev) => prev.filter((p) => p.$id !== project.$id));
      setOutputs((prev) => prev.filter((o) => !outputIds.includes(o.$id)));
      toast.success("Project deleted.");
    } catch {
      toast.error("Failed to delete project. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  async function handleDuplicate(e: React.MouseEvent, project: Project) {
    e.preventDefault();
    e.stopPropagation();

    setDuplicating(project.$id);
    try {
      const res = await fetch(`/api/projects/${project.$id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Duplicate failed");
      toast.success("Project duplicated");
      router.push(`/dashboard/projects/${data.newProjectId}`);
    } catch {
      toast.error("Failed to duplicate project.");
      setDuplicating(null);
    }
  }

  const last28Days = useMemo(() => getLast28Days(), []);

  const chartData = useMemo(
    () =>
      last28Days.map((day) => ({
        date: formatDay(day),
        count: projects.filter((p) => p.createdAt.slice(0, 10) === day).length,
      })),
    [projects, last28Days]
  );

  const platformBreakdown = useMemo(
    () =>
      ["facebook", "tiktok", "instagram", "linkedin", "twitter"].map((ch) => ({
        channel: ch,
        count: outputs.filter((o) => o.channel === ch).length,
      })),
    [outputs]
  );

  const sourceTypeData = useMemo(
    () =>
      (["url", "text", "audio"] as SourceType[]).map((type, i) => ({
        name: type,
        value: projects.filter((p) => p.sourceType === type).length,
        color: SOURCE_PIE_COLORS[i],
      })),
    [projects]
  );

  const avgOutputsPerProject = useMemo(() => {
    if (projects.length === 0) return "—";
    return (outputs.length / projects.length).toFixed(1);
  }, [projects.length, outputs.length]);

  const mostActiveDay = useMemo(() => {
    if (projects.length === 0) return "—";
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      const day = p.createdAt.slice(0, 10);
      counts[day] = (counts[day] ?? 0) + 1;
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!top) return "—";
    return formatDay(top[0]);
  }, [projects]);

  const projectsLast7 = useMemo(
    () =>
      projects.filter((p) => {
        const d = new Date(p.createdAt);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return d >= cutoff;
      }).length,
    [projects]
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-slate-700 rounded animate-pulse" />
            <div className="h-4 w-56 bg-slate-700/50 rounded animate-pulse" />
          </div>
          <div className="h-9 w-28 bg-slate-700 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-700/60 rounded mb-3" />
              <div className="h-8 w-12 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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

      {/* Stats cards — 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Projects</p>
          <p className="text-3xl font-bold text-white">{projects.length}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Outputs</p>
          <p className="text-3xl font-bold text-white">{outputs.length}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Projects (7 Days)</p>
          <p className="text-3xl font-bold text-white">{projectsLast7}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Avg Outputs/Project</p>
          <p className="text-3xl font-bold text-white">{avgOutputsPerProject}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Most Active Day</p>
          <p className="text-xl font-bold text-white">{mostActiveDay}</p>
        </GlassCard>
      </div>

      {/* Charts row 1: 28-day trend + platform breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 28-day line chart */}
        <GlassCard padding="md">
          <p className="text-sm font-medium text-slate-300 mb-4">
            Projects created — last 28 days
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={6}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
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
                cursor={{ stroke: "rgba(139,92,246,0.3)" }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#7c3aed" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Platform breakdown */}
        <GlassCard padding="md">
          <p className="text-sm font-medium text-slate-300 mb-4">
            Outputs by platform
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={platformBreakdown} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="channel"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {platformBreakdown.map((entry) => (
                  <Cell key={entry.channel} fill={PLATFORM_COLORS[entry.channel] ?? "#7c3aed"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Source type distribution */}
      <GlassCard padding="md">
        <p className="text-sm font-medium text-slate-300 mb-4">
          Projects by source type
        </p>
        <div className="flex items-center gap-8">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={sourceTypeData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {sourceTypeData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3">
            {sourceTypeData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-sm text-slate-300 capitalize flex items-center gap-2">
                  {SOURCE_ICONS[entry.name as SourceType]} {entry.name}
                </span>
                <span className="text-sm font-semibold text-white ml-auto">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
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
        <EmptyDashboard filtered={projects.length > 0} />
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

              {/* Action buttons — float over card on hover */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Duplicate button */}
                <button
                  onClick={(e) => handleDuplicate(e, project)}
                  disabled={duplicating === project.$id || !!deleting}
                  className="p-1.5 rounded-lg bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 hover:text-slate-300 transition-all disabled:cursor-not-allowed"
                  title="Duplicate project"
                >
                  {duplicating === project.$id ? (
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, project)}
                  disabled={deleting === project.$id || !!duplicating}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all disabled:cursor-not-allowed"
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
            </div>
          ))}
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
