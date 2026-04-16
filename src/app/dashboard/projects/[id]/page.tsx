"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Query } from "appwrite";
import { toast } from "sonner";
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

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Regenerate state
  const [regenerating, setRegenerating] = useState<ChannelType | null>(null);
  const [streamedContent, setStreamedContent] = useState("");

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

  // When active channel changes, sync edit state to that output (skip during streaming)
  useEffect(() => {
    if (regenerating) return;
    const output = outputs.find((o) => o.channel === activeChannel);
    if (output) {
      setEditingId(output.$id);
      setEditContent(output.content);
    }
  }, [activeChannel, outputs, regenerating]);

  async function handleBlur() {
    if (!editingId) return;

    const original = outputs.find((o) => o.$id === editingId);
    if (!original || original.content === editContent) return; // no change

    setSaving(true);
    try {
      const res = await fetch(`/api/outputs/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to save.");
        setEditContent(original.content); // revert
        return;
      }

      // Update outputs state with saved content
      setOutputs((prev) =>
        prev.map((o) => (o.$id === editingId ? { ...o, content: editContent } : o))
      );
    } catch {
      toast.error("Failed to save changes.");
      if (original) setEditContent(original.content); // revert
    } finally {
      setSaving(false);
    }
  }

  async function handleRegenerate() {
    if (!activeOutput || regenerating) return;

    setRegenerating(activeChannel);
    setStreamedContent("");

    try {
      const res = await fetch(`/api/outputs/${activeOutput.$id}/regenerate`, {
        method: "POST",
      });

      if (!res.ok || !res.body) {
        toast.error("Regeneration failed.");
        setRegenerating(null);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setStreamedContent(accumulated);
      }

      setOutputs((prev) =>
        prev.map((o) =>
          o.$id === activeOutput.$id ? { ...o, content: accumulated } : o
        )
      );
      setEditContent(accumulated);
    } catch {
      toast.error("Regeneration failed.");
    } finally {
      setRegenerating(null);
      setStreamedContent("");
    }
  }

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

      {/* Preview + edit */}
      <div className="pt-2">
        {activeOutput ? (
          <>
            {activeChannel === "facebook" && (
              <FacebookPreview content={editContent || activeOutput.content} />
            )}
            {activeChannel === "tiktok" && (
              <TikTokPreview content={editContent || activeOutput.content} />
            )}
            {activeChannel === "instagram" && (
              <InstagramPreview content={editContent || activeOutput.content} />
            )}

            {/* Inline edit textarea — auto-saves on blur */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Edit content
                </label>
                {saving && (
                  <span className="text-xs text-slate-500">Saving…</span>
                )}
              </div>
              <textarea
                className="w-full h-40 rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-200 p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                value={regenerating === activeChannel ? streamedContent : editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onBlur={handleBlur}
                disabled={!!regenerating}
                readOnly={!!regenerating}
              />
            </div>

            <button
              onClick={handleRegenerate}
              disabled={!!regenerating}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {regenerating === activeChannel ? "Regenerating…" : "Regenerate"}
            </button>
          </>
        ) : (
          <p className="text-slate-400 text-sm">No output found for this channel.</p>
        )}
      </div>
    </div>
  );
}
