"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Query } from "appwrite";
import { databases, DB_ID, PROJECTS_COL, OUTPUTS_COL } from "@/lib/appwrite";
import { ChannelTabs } from "@/components/preview/ChannelTabs";
import { FacebookPreview } from "@/components/preview/FacebookPreview";
import { TikTokPreview } from "@/components/preview/TikTokPreview";
import { InstagramPreview } from "@/components/preview/InstagramPreview";
import type { Project, Output, ChannelType } from "@/types";

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChannelType>("facebook");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [projectDoc, outputsResult] = await Promise.all([
          databases.getDocument(DB_ID, PROJECTS_COL, id),
          databases.listDocuments(DB_ID, OUTPUTS_COL, [
            Query.equal("projectId", id),
          ]),
        ]);

        setProject(projectDoc as unknown as Project);
        setOutputs(outputsResult.documents as unknown as Output[]);
      } catch {
        setError("Failed to load project.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const activeOutput = outputs.find((o) => o.channel === activeChannel);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400 text-sm">{error ?? "Project not found."}</p>
        <Link href="/dashboard" className="text-indigo-400 text-sm hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">{project.title}</h1>
        </div>
      </div>

      {/* Channel tabs */}
      <ChannelTabs activeChannel={activeChannel} onChannelChange={setActiveChannel} />

      {/* Preview */}
      <div className="pt-2">
        {activeOutput ? (
          <>
            {activeChannel === "facebook" && (
              <FacebookPreview content={activeOutput.content} />
            )}
            {activeChannel === "tiktok" && (
              <TikTokPreview content={activeOutput.content} />
            )}
            {activeChannel === "instagram" && (
              <InstagramPreview content={activeOutput.content} />
            )}

            {/* Inline edit placeholder — wired up in Milestone 9 */}
            <div className="mt-6 space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Edit content
              </label>
              <textarea
                className="w-full h-40 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue={activeOutput.content}
                readOnly
              />
            </div>

            {/* Regenerate placeholder — wired up in Milestone 10 */}
            <button
              disabled
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600/40 text-indigo-300 cursor-not-allowed opacity-50"
            >
              Regenerate
            </button>
          </>
        ) : (
          <p className="text-slate-400 text-sm">No output found for this channel.</p>
        )}
      </div>
    </div>
  );
}
