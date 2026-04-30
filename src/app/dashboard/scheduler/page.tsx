"use client";

import { useEffect, useState } from "react";
import { Query } from "appwrite";
import { account, databases, DB_ID, SCHEDULES_COL, OUTPUTS_COL, PROJECTS_COL } from "@/lib/appwrite";
import type { Schedule, Output, Project, ChannelType } from "@/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CalendarWeekView } from "@/components/scheduler/CalendarWeekView";

interface ScheduleRow {
  schedule: Schedule;
  output: Output | null;
  project: Project | null;
}

const CHANNEL_LABELS: Record<ChannelType, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter",
};

const CHANNEL_COLORS: Record<ChannelType, string> = {
  facebook: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  tiktok: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  instagram: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  linkedin: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  twitter: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  sent: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

type ViewMode = "list" | "calendar";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString([], { month: "short", day: "numeric" });
  const year = weekEnd.getFullYear();
  return `${fmt(weekStart)} – ${fmt(weekEnd)}, ${year}`;
}

export default function SchedulerPage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));

  useEffect(() => {
    async function load() {
      try {
        const user = await account.get();
        const userId = user.$id;

        // Fetch schedules for user
        const schedulesResult = await databases.listDocuments(DB_ID, SCHEDULES_COL, [
          Query.equal("userId", userId),
          Query.orderAsc("scheduledAt"),
        ]);
        const schedules = schedulesResult.documents as unknown as Schedule[];

        // Fetch each referenced output by document ID (avoids needing a userId index on outputs)
        const uniqueOutputIds = Array.from(new Set(schedules.map((s) => s.outputId)));
        const outputDocs = await Promise.all(
          uniqueOutputIds.map((oid) =>
            databases.getDocument(DB_ID, OUTPUTS_COL, oid).catch(() => null)
          )
        );
        const outputMap = new Map<string, Output>();
        outputDocs.forEach((doc) => {
          if (doc) outputMap.set(doc.$id, doc as unknown as Output);
        });

        // Fetch each referenced project by document ID
        const uniqueProjectIds = Array.from(
          new Set(
            Array.from(outputMap.values()).map((o) => o.projectId).filter(Boolean)
          )
        );
        const projectDocs = await Promise.all(
          uniqueProjectIds.map((pid) =>
            databases.getDocument(DB_ID, PROJECTS_COL, pid).catch(() => null)
          )
        );
        const projectMap = new Map<string, Project>();
        projectDocs.forEach((doc) => {
          if (doc) projectMap.set(doc.$id, doc as unknown as Project);
        });

        const assembled: ScheduleRow[] = schedules.map((schedule) => {
          const output = outputMap.get(schedule.outputId) ?? null;
          const project = output ? (projectMap.get(output.projectId) ?? null) : null;
          return { schedule, output, project };
        });

        setRows(assembled);
      } catch {
        setError("Failed to load schedules.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeInUp">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Scheduler</h1>
          <p className="text-slate-400 text-sm mt-1">Your scheduled posts.</p>
        </div>

        {/* List / Calendar toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800/60 border border-slate-700/50 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "list"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === "calendar"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Calendar week navigation (only in calendar mode) */}
      {viewMode === "calendar" && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            ← Prev
          </button>
          <span className="flex-1 text-center text-sm text-slate-300 font-medium">
            {formatWeekRange(weekStart)}
          </span>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            Next →
          </button>
          <button
            onClick={() => setWeekStart(getMondayOfWeek(new Date()))}
            className="px-3 py-1.5 rounded-lg border border-indigo-600/50 bg-indigo-600/20 text-xs text-indigo-300 hover:bg-indigo-600/30 transition-colors"
          >
            Today
          </button>
        </div>
      )}

      {/* Calendar view */}
      {viewMode === "calendar" && (
        <CalendarWeekView rows={rows} weekStart={weekStart} />
      )}

      {/* List view */}
      {viewMode === "list" && (
        <>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-slate-400 text-sm">No scheduled posts yet.</p>
              <p className="text-slate-600 text-xs">
                Open a project preview and pick a date to schedule a post.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map(({ schedule, output, project }) => {
                const channel = (schedule.platform ?? output?.channel ?? "facebook") as ChannelType;
                const scheduledLocal = new Date(schedule.scheduledAt).toLocaleString();

                return (
                  <div
                    key={schedule.$id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
                  >
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-medium ${CHANNEL_COLORS[channel] ?? CHANNEL_COLORS.facebook}`}
                    >
                      {CHANNEL_LABELS[channel] ?? channel}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {project?.title ?? "Unknown project"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{scheduledLocal}</p>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-medium ${STATUS_COLORS[schedule.status] ?? STATUS_COLORS.scheduled}`}
                    >
                      {schedule.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
    </ErrorBoundary>
  );
}
