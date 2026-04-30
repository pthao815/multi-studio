"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ID, Query } from "appwrite";
import { toast } from "sonner";
import { account, databases, DB_ID, PROJECTS_COL, OUTPUTS_COL, SCHEDULES_COL } from "@/lib/appwrite";
import { ChannelTabs } from "@/components/preview/ChannelTabs";
import { FacebookPreview } from "@/components/preview/FacebookPreview";
import { TikTokPreview } from "@/components/preview/TikTokPreview";
import { InstagramPreview } from "@/components/preview/InstagramPreview";
import { LinkedInPreview } from "@/components/preview/LinkedInPreview";
import { TwitterPreview } from "@/components/preview/TwitterPreview";
import { ImagePromptButton } from "@/components/preview/ImagePromptButton";
import { QualityScoreBadge } from "@/components/preview/QualityScoreBadge";
import { ToneCompareModal } from "@/components/preview/ToneCompareModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Project, Output, ChannelType, BrandVoice } from "@/types";

const WORD_LIMITS: Partial<Record<ChannelType, number>> = {
  facebook: 600,
  linkedin: 400,
  tiktok: 160,
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function InlineEditCount({ channel, text }: { channel: ChannelType; text: string }) {
  if (channel === "instagram") return null;

  if (channel === "twitter") {
    const tweets = text.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
    const maxLen = tweets.reduce((m, t) => Math.max(m, t.length), 0);
    const color = maxLen > 280 ? "text-red-400" : maxLen > 224 ? "text-amber-400" : "text-slate-500";
    return (
      <p className={`text-xs text-right ${color}`}>
        Longest tweet: {maxLen} / 280 chars
      </p>
    );
  }

  const limit = WORD_LIMITS[channel];
  if (!limit) return null;
  const words = countWords(text);
  const amber = Math.floor(limit * 0.8);
  const color = words > limit ? "text-red-400" : words > amber ? "text-amber-400" : "text-slate-500";
  return (
    <p className={`text-xs text-right ${color}`}>
      {words.toLocaleString()} / {limit} words
    </p>
  );
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [outputs, setOutputs] = useState<Output[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChannelType>("facebook");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

  // Schedule state
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Regenerate state
  const [regenerating, setRegenerating] = useState<ChannelType | null>(null);
  const [streamedContent, setStreamedContent] = useState("");

  // Quality score state
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());

  // Tone compare modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [userBrandVoice, setUserBrandVoice] = useState<BrandVoice>("calm");

  useEffect(() => {
    async function load() {
      try {
        const [user, projectDoc, outputsResult] = await Promise.all([
          account.get(),
          databases.getDocument(DB_ID, PROJECTS_COL, id),
          databases.listDocuments(DB_ID, OUTPUTS_COL, [
            Query.equal("projectId", id),
          ]),
        ]);

        setUserId(user.$id);
        setProject(projectDoc as unknown as Project);

        const fetchedOutputs = outputsResult.documents as unknown as Output[];
        setOutputs(fetchedOutputs);

        // Fetch brand voice for tone compare modal
        try {
          const profilesResult = await databases.listDocuments(
            DB_ID,
            process.env.NEXT_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID!,
            [Query.equal("userId", user.$id)]
          );
          if (profilesResult.documents.length > 0) {
            const profile = profilesResult.documents[0] as unknown as { brandVoice: BrandVoice };
            setUserBrandVoice(profile.brandVoice ?? "calm");
          }
        } catch {
          // Fall through with calm default
        }

        // Kick off quality scoring in background — do NOT await (page must render first)
        const missing = fetchedOutputs.filter((o) => !o.qualityScore);
        if (missing.length > 0) {
          setScoringIds(new Set(missing.map((o) => o.$id)));
          missing.forEach(async (o) => {
            try {
              const res = await fetch(`/api/outputs/${o.$id}/score`, { method: "POST" });
              if (res.ok) {
                const data = await res.json() as { qualityScore: string };
                setOutputs((prev) =>
                  prev.map((out) =>
                    out.$id === o.$id ? { ...out, qualityScore: data.qualityScore } : out
                  )
                );
              }
            } catch {
              // Silent fail — badge renders "—" placeholder
            } finally {
              setScoringIds((prev) => { const next = new Set(prev); next.delete(o.$id); return next; });
            }
          });
        }
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

      // Optimistically update content + previousContent (DEC-22)
      setOutputs((prev) =>
        prev.map((o) =>
          o.$id === editingId
            ? { ...o, content: editContent, previousContent: original.content }
            : o
        )
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

      // Optimistically update content + previousContent (DEC-22)
      setOutputs((prev) =>
        prev.map((o) =>
          o.$id === activeOutput.$id
            ? { ...o, content: accumulated, previousContent: o.content }
            : o
        )
      );
      setEditContent(accumulated);

      // Re-score this channel after regeneration (TASK-64)
      const scoreOutputId = activeOutput.$id;
      setScoringIds((prev) => new Set(Array.from(prev).concat(scoreOutputId)));
      fetch(`/api/outputs/${scoreOutputId}/score`, { method: "POST" })
        .then((res) => res.ok ? res.json() : null)
        .then((data: { qualityScore: string } | null) => {
          if (data?.qualityScore) {
            setOutputs((prev) =>
              prev.map((o) => o.$id === scoreOutputId ? { ...o, qualityScore: data.qualityScore } : o)
            );
          }
        })
        .catch(() => null)
        .finally(() => setScoringIds((prev) => { const next = new Set(prev); next.delete(scoreOutputId); return next; }));
    } catch {
      toast.error("Regeneration failed.");
    } finally {
      setRegenerating(null);
      setStreamedContent("");
    }
  }

  const activeOutput = outputs.find((o) => o.channel === activeChannel);

  // Instagram hashtag refresh — update local output state
  function handleInstagramContentUpdated(newContent: string) {
    setOutputs((prev) =>
      prev.map((o) =>
        o.$id === activeOutput?.$id ? { ...o, content: newContent } : o
      )
    );
    setEditContent(newContent);
  }

  // Tone compare — "Use This Version" saves via PUT then updates local state
  function handleCompareUseVersion(newContent: string) {
    setOutputs((prev) =>
      prev.map((o) =>
        o.$id === activeOutput?.$id
          ? { ...o, content: newContent, previousContent: o.content }
          : o
      )
    );
    setEditContent(newContent);
  }

  // Bidirectional swap: content ↔ previousContent (DEC-22)
  function handleRestored(newContent: string) {
    setOutputs((prev) =>
      prev.map((o) =>
        o.$id === activeOutput?.$id
          ? { ...o, content: newContent, previousContent: o.content }
          : o
      )
    );
    setEditContent(newContent);
  }

  function handleCopy() {
    if (!activeOutput) return;
    navigator.clipboard.writeText(activeOutput.content)
      .then(() => toast.success("Copied!"))
      .catch(() => toast.error("Failed to copy."));
  }

  function handleDownloadTxt() {
    if (!activeOutput) return;
    const blob = new Blob([activeOutput.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeChannel}-content.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSchedule() {
    if (!activeOutput || !scheduleDate || !userId) return;
    setScheduling(true);
    try {
      await databases.createDocument(DB_ID, SCHEDULES_COL, ID.unique(), {
        outputId: activeOutput.$id,
        userId,
        platform: activeChannel,
        scheduledAt: new Date(scheduleDate).toISOString(),
        status: "scheduled",
      });
      toast.success("Scheduled!");
      setScheduleDate("");
    } catch {
      toast.error("Failed to schedule.");
    } finally {
      setScheduling(false);
    }
  }

  function handleDownloadJson() {
    const fb = outputs.find((o) => o.channel === "facebook");
    const tk = outputs.find((o) => o.channel === "tiktok");
    const ig = outputs.find((o) => o.channel === "instagram");
    const li = outputs.find((o) => o.channel === "linkedin");
    const tw = outputs.find((o) => o.channel === "twitter");

    let instagramParsed: unknown = ig?.content ?? "";
    try {
      if (ig?.content) instagramParsed = JSON.parse(ig.content);
    } catch {
      // keep raw string if not valid JSON
    }

    const data = {
      facebook: fb?.content ?? "",
      tiktok: tk?.content ?? "",
      instagram: instagramParsed,
      linkedin: li?.content ?? "",
      twitter: tw?.content ?? "",
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "all-outputs.json";
    a.click();
    URL.revokeObjectURL(url);
  }

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
    <ErrorBoundary>
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

      {/* Channel tabs + quality score badge */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <ChannelTabs activeChannel={activeChannel} onChannelChange={setActiveChannel} />
        </div>
        {activeOutput && (
          <div className="shrink-0">
            <QualityScoreBadge
              qualityScore={activeOutput.qualityScore}
              loading={scoringIds.has(activeOutput.$id)}
            />
          </div>
        )}
      </div>

      {/* Preview + edit */}
      <div className="pt-2">
        {activeOutput ? (
          <>
            {activeChannel === "facebook" && (
              <FacebookPreview
                content={editContent || activeOutput.content}
                outputId={activeOutput.$id}
                previousContent={activeOutput.previousContent}
                onRestored={handleRestored}
              />
            )}
            {activeChannel === "tiktok" && (
              <TikTokPreview
                content={editContent || activeOutput.content}
                outputId={activeOutput.$id}
                previousContent={activeOutput.previousContent}
                onRestored={handleRestored}
              />
            )}
            {activeChannel === "instagram" && (
              <InstagramPreview
                content={editContent || activeOutput.content}
                outputId={activeOutput.$id}
                previousContent={activeOutput.previousContent}
                onRestored={handleRestored}
                onContentUpdated={handleInstagramContentUpdated}
              />
            )}
            {activeChannel === "linkedin" && (
              <LinkedInPreview
                content={editContent || activeOutput.content}
                outputId={activeOutput.$id}
                previousContent={activeOutput.previousContent}
                onRestored={handleRestored}
              />
            )}
            {activeChannel === "twitter" && (
              <TwitterPreview
                content={editContent || activeOutput.content}
                outputId={activeOutput.$id}
                previousContent={activeOutput.previousContent}
                onRestored={handleRestored}
              />
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
              {/* Live count indicator */}
              <InlineEditCount
                channel={activeChannel}
                text={regenerating === activeChannel ? streamedContent : editContent}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={!!regenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {regenerating === activeChannel ? "Regenerating…" : "Regenerate"}
              </button>

              <button
                onClick={() => setCompareModalOpen(true)}
                disabled={!!regenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-700 text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Compare Tones
              </button>

              <button
                onClick={handleCopy}
                disabled={!!regenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Copy
              </button>

              <button
                onClick={handleDownloadTxt}
                disabled={!!regenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Download .txt
              </button>

              <button
                onClick={handleDownloadJson}
                disabled={!!regenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Download .json
              </button>
            </div>

            {/* Image prompt */}
            <ImagePromptButton
              outputId={activeOutput.$id}
              initialImagePrompt={activeOutput.imagePrompt}
            />

            {/* Schedule */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-lg border border-slate-700 bg-slate-800/50 text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
              />
              <button
                onClick={handleSchedule}
                disabled={!scheduleDate || scheduling || !!regenerating}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scheduling ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-sm">No output found for this channel.</p>
        )}
      </div>

      {/* Tone Compare Modal (TASK-71/73) */}
      {compareModalOpen && activeOutput && (
        <ToneCompareModal
          projectId={id}
          outputId={activeOutput.$id}
          channel={activeChannel}
          initialBrandVoice={userBrandVoice}
          onUseVersion={handleCompareUseVersion}
          onClose={() => setCompareModalOpen(false)}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
