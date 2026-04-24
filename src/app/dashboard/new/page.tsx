"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ID } from "appwrite";
import { account, databases, DB_ID, PROJECTS_COL } from "@/lib/appwrite";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { SourceTypeSelector, type SourceType } from "@/components/input/SourceTypeSelector";
import { UrlInput } from "@/components/input/UrlInput";
import { TextInput } from "@/components/input/TextInput";
import { AudioUpload } from "@/components/input/AudioUpload";
import { deriveTitle } from "@/lib/utils";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const CHANNELS = [
  { label: "Facebook",  color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { label: "TikTok",    color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  { label: "Instagram", color: "bg-pink-500/20 text-pink-300 border-pink-500/30" },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Choose your source",
    desc: "Paste an article URL, enter text manually, or upload an audio file.",
  },
  {
    step: "2",
    title: "AI analyses & writes",
    desc: "Gemini reads your content and generates optimised posts for each social channel.",
  },
  {
    step: "3",
    title: "Preview, edit & publish",
    desc: "Review results, edit inline, download files, or schedule posts.",
  },
];

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

function ChannelBadges() {
  return (
    <div className="flex gap-2 flex-wrap">
      {CHANNELS.map(({ label, color }) => (
        <span key={label} className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${color}`}>
          {label}
        </span>
      ))}
    </div>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [textContent, setTextContent] = useState("");

  // Preview state
  const [scrapedData, setScrapedData] = useState<{ title: string; text: string } | null>(null);
  const [transcriptData, setTranscriptData] = useState<{ transcript: string; fileId: string; title: string } | null>(null);
  const [audioResetKey, setAudioResetKey] = useState(0);

  useEffect(() => {
    account.get().then((user) => setUserId(user.$id)).catch(() => router.push("/login"));
  }, [router]);

  // Clear previews when switching source type
  useEffect(() => {
    setScrapedData(null);
    setTranscriptData(null);
    setTextContent("");
    setAudioResetKey((k) => k + 1);
  }, [sourceType]);

  async function createProject(
    title: string,
    srcType: "url" | "text" | "audio",
    sourceContent: string,
    audioFileId = "",
    transcription = ""
  ) {
    if (!userId) return;
    setCreating(true);
    try {
      const now = new Date().toISOString();
      const doc = await databases.createDocument(DB_ID, PROJECTS_COL, ID.unique(), {
        userId,
        title,
        sourceType: srcType,
        sourceContent,
        audioFileId,
        transcription,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
      fetch(`/api/projects/${doc.$id}/generate`, { method: "POST" }).catch(() => null);
      router.push(`/dashboard/projects/${doc.$id}/processing`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project.";
      toast.error(message);
      setCreating(false);
    }
  }

  // URL handlers
  function handleUrlSuccess({ title, text }: { title: string; text: string }) {
    setScrapedData({ title, text });
  }
  async function handleConfirmUrl() {
    if (!scrapedData) return;
    await createProject(scrapedData.title, "url", scrapedData.text);
  }

  // Audio handlers
  function handleAudioReady({ transcript, fileId, title }: { transcript: string; fileId: string; title: string }) {
    setTranscriptData({ transcript, fileId, title });
  }
  async function handleConfirmAudio() {
    if (!transcriptData) return;
    await createProject(
      transcriptData.title,
      "audio",
      transcriptData.transcript,
      transcriptData.fileId,
      transcriptData.transcript
    );
  }
  function handleAudioReset() {
    setTranscriptData(null);
    setAudioResetKey((k) => k + 1);
  }

  // Text handler
  async function handleTextSubmit() {
    if (!textContent.trim()) {
      toast.error("Please enter some content.");
      return;
    }
    await createProject(deriveTitle("text", textContent), "text", textContent);
  }

  // --- Right panel ---
  function renderRightPanel() {
    // URL: scraped preview
    if (sourceType === "url" && scrapedData) {
      return (
        <GlassCard padding="md" className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">✓</span>
            <span className="text-sm font-medium text-green-400">Content extracted</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Title</p>
              <p className="text-sm font-semibold text-white">{scrapedData.title || "(No title)"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Extracted content</p>
              <p className="text-sm text-slate-300 leading-relaxed">{truncate(scrapedData.text, 240)}</p>
              <p className="text-xs text-slate-500 mt-1.5">{scrapedData.text.length.toLocaleString()} characters</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Will generate for</p>
            <ChannelBadges />
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
            <GradientButton
              onClick={handleConfirmUrl}
              loading={creating}
              disabled={creating}
              size="md"
              className="w-full"
            >
              {creating ? "Creating…" : "Generate Content →"}
            </GradientButton>
            <button
              onClick={() => setScrapedData(null)}
              disabled={creating}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 text-center"
            >
              Try a different URL
            </button>
          </div>
        </GlassCard>
      );
    }

    // Audio: transcript preview
    if (sourceType === "audio" && transcriptData) {
      return (
        <GlassCard padding="md" className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">✓</span>
            <span className="text-sm font-medium text-green-400">Transcript ready</span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">File</p>
              <p className="text-sm font-semibold text-white">{transcriptData.title}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transcript</p>
              <p className="text-sm text-slate-300 leading-relaxed">{truncate(transcriptData.transcript, 240)}</p>
              <p className="text-xs text-slate-500 mt-1.5">{transcriptData.transcript.length.toLocaleString()} characters</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Will generate for</p>
            <ChannelBadges />
          </div>

          <div className="flex flex-col gap-2 pt-1 border-t border-white/[0.06]">
            <GradientButton
              onClick={handleConfirmAudio}
              loading={creating}
              disabled={creating}
              size="md"
              className="w-full"
            >
              {creating ? "Creating…" : "Generate Content →"}
            </GradientButton>
            <button
              onClick={handleAudioReset}
              disabled={creating}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 text-center"
            >
              Upload a different file
            </button>
          </div>
        </GlassCard>
      );
    }

    // Text: live channel hint once content is substantial
    if (sourceType === "text" && textContent.trim().length > 30) {
      return (
        <GlassCard padding="md" className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Ready to generate</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {textContent.trim().length.toLocaleString()} characters &middot; Click &ldquo;Generate Content&rdquo; to proceed
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Will generate for</p>
            <ChannelBadges />
          </div>
          <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
            <p className="text-xs text-slate-400">✓ Facebook — 400–600 word post with CTA</p>
            <p className="text-xs text-slate-400">✓ TikTok — scene-by-scene script [Scene 1]…</p>
            <p className="text-xs text-slate-400">✓ Instagram — 10 slides + caption + 30 hashtags</p>
          </div>
        </GlassCard>
      );
    }

    // Default: how it works guide
    return (
      <div className="flex flex-col gap-5">
        {HOW_IT_WORKS.map(({ step, title, desc }) => (
          <div key={step} className="flex gap-4">
            <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {step}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 mb-2.5">Will generate content for 3 channels:</p>
          <ChannelBadges />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">✓ Facebook — 400–600 word post with CTA</p>
          <p className="text-xs text-slate-400">✓ TikTok — scene-by-scene script [Scene 1]…</p>
          <p className="text-xs text-slate-400">✓ Instagram — 10 slides + caption + 30 hashtags</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeInUp">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">New Project</h1>
        <p className="text-slate-400 text-sm mt-1">
          Choose a source and generate social media content for 3 channels in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        {/* Left: Input form */}
        <GlassCard padding="none" className="p-6 flex flex-col gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Source type
            </label>
            <SourceTypeSelector value={sourceType} onChange={setSourceType} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {sourceType === "url" ? "Page URL" : sourceType === "text" ? "Paste content" : "Upload audio"}
            </label>

            {sourceType === "url" && (
              <UrlInput
                onSuccess={handleUrlSuccess}
                disabled={creating || !userId || !!scrapedData}
              />
            )}

            {sourceType === "text" && (
              <div className="flex flex-col gap-3">
                <TextInput
                  value={textContent}
                  onContentChange={setTextContent}
                  disabled={creating}
                />
                <GradientButton
                  onClick={handleTextSubmit}
                  loading={creating}
                  disabled={creating || !textContent.trim()}
                  size="md"
                  className="w-full"
                >
                  {creating ? "Creating…" : "Generate Content"}
                </GradientButton>
              </div>
            )}

            {sourceType === "audio" && (
              <AudioUpload
                key={audioResetKey}
                onTranscriptReady={handleAudioReady}
                disabled={creating || !userId || !!transcriptData}
              />
            )}
          </div>
        </GlassCard>

        {/* Right: Guide or Preview */}
        <div>{renderRightPanel()}</div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
