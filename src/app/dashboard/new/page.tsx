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
  { label: "LinkedIn",  color: "bg-blue-700/20 text-blue-200 border-blue-700/30" },
  { label: "Twitter",   color: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
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
    desc: "Groq reads your content and generates optimised posts for each social channel.",
  },
  {
    step: "3",
    title: "Preview, edit & publish",
    desc: "Review results, edit inline, download files, or schedule posts.",
  },
];

const CHAR_WARN = 10_000;
const CHAR_LIMIT = 12_000;
const CHAR_SUMMARISE = 8_000;

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

function charCountClass(len: number) {
  if (len >= CHAR_LIMIT) return "text-red-400";
  if (len >= CHAR_WARN) return "text-amber-400";
  return "text-slate-500";
}

interface SourcePreviewPanelProps {
  editedContent: string;
  editedTitle: string;
  onContentChange: (v: string) => void;
  onTitleChange: (v: string) => void;
  onBlur: () => void;
  open: boolean;
  onToggle: () => void;
  saving: boolean;
  summarising?: boolean;
  summarisedContent?: string | null;
  showOriginal?: boolean;
  onToggleOriginal?: () => void;
}

function SourcePreviewPanel({
  editedContent,
  editedTitle,
  onContentChange,
  onTitleChange,
  onBlur,
  open,
  onToggle,
  saving,
  summarising,
  summarisedContent,
  showOriginal,
  onToggleOriginal,
}: SourcePreviewPanelProps) {
  return (
    <div className="border-t border-white/[0.06] pt-3">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors"
      >
        <span>Source Preview</span>
        <span className="flex items-center gap-2">
          {saving && <span className="text-slate-500">Saving…</span>}
          <span>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Title</label>
            <input
              value={editedTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onBlur}
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50"
              placeholder="Project title"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Source Content</label>
            <textarea
              value={editedContent}
              onChange={(e) => onContentChange(e.target.value)}
              onBlur={onBlur}
              rows={8}
              className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 resize-none focus:outline-none focus:border-violet-500/50"
              placeholder="Source content…"
            />
            <p className={`text-xs mt-1 ${charCountClass(editedContent.length)}`}>
              {editedContent.length.toLocaleString()} characters
              {editedContent.length >= CHAR_LIMIT && " — will be truncated at 12,000"}
            </p>
          </div>

          {summarising && (
            <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
              Summarising source content…
            </div>
          )}

          {!summarising && summarisedContent && (
            <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-300 space-y-2">
              <p>Source summarised: {editedContent.length.toLocaleString()} chars → {summarisedContent.length.toLocaleString()} chars. Generation will use summarised version.</p>
              <button
                onClick={onToggleOriginal}
                className="text-green-400 hover:text-green-300 underline"
              >
                {showOriginal ? "Hide original" : "Show original"}
              </button>
              {showOriginal && (
                <p className="text-slate-400 leading-relaxed mt-2 border-t border-green-500/20 pt-2">
                  {editedContent.slice(0, 500)}{editedContent.length > 500 ? "…" : ""}
                </p>
              )}
            </div>
          )}

          {!summarising && !summarisedContent && editedContent.length > CHAR_SUMMARISE && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
              Content is large — it will be summarised before generation to improve output quality.
            </div>
          )}
        </div>
      )}
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

  // Source edit state (TASK-53)
  const [projectId, setProjectId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [sourcePreviewOpen, setSourcePreviewOpen] = useState(false);
  const [savingSource, setSavingSource] = useState(false);

  // Summarisation state (TASK-66)
  const [summarising, setSummarising] = useState(false);
  const [summarisedContent, setSummarisedContent] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    account.get().then((user) => setUserId(user.$id)).catch(() => router.push("/login"));
  }, [router]);

  // Clear previews when switching source type
  useEffect(() => {
    setScrapedData(null);
    setTranscriptData(null);
    setTextContent("");
    setAudioResetKey((k) => k + 1);
    setProjectId(null);
    setEditedContent("");
    setEditedTitle("");
    setSourcePreviewOpen(false);
  }, [sourceType]);

  // Creates project immediately (early creation for source editing)
  async function createProjectEarly(
    title: string,
    srcType: "url" | "text" | "audio",
    sourceContent: string,
    audioFileId = "",
    transcription = ""
  ): Promise<string | null> {
    if (!userId) return null;
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
      return doc.$id;
    } catch {
      return null;
    }
  }

  // Creates project and navigates (text / fallback path)
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

  // Persist source edits to Appwrite on textarea/title blur (TASK-53)
  async function handleSourceBlur() {
    if (!projectId) return;
    setSavingSource(true);
    try {
      await fetch(`/api/projects/${projectId}/source`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceContent: editedContent, title: editedTitle }),
      });
    } catch {
      // Silent fail — edited content is still in local state for generation
    } finally {
      setSavingSource(false);
    }
  }

  // Trigger summarisation if content > 8000 chars (TASK-66 / DEC-25)
  async function triggerSummarise(pid: string) {
    setSummarising(true);
    try {
      const res = await fetch(`/api/projects/${pid}/source`, { method: "POST" });
      if (res.ok) {
        const data = await res.json() as { summarisedContent: string; originalLength: number; summarisedLength: number };
        setSummarisedContent(data.summarisedContent);
        toast.success(`Source summarised: ${data.originalLength.toLocaleString()} → ${data.summarisedLength.toLocaleString()} chars`);
      } else {
        const errBody = await res.json().catch(() => ({ code: "UNKNOWN" }));
        console.warn("[triggerSummarise] failed:", res.status, errBody);
        toast.error(`Summarisation failed (${res.status}: ${errBody.code ?? errBody.error ?? "unknown"})`);
      }
    } catch (e) {
      console.warn("[triggerSummarise] error:", e);
      toast.error("Summarisation request failed — check the terminal");
    } finally {
      setSummarising(false);
    }
  }

  // URL handlers
  async function handleUrlSuccess({ title, text }: { title: string; text: string }) {
    setScrapedData({ title, text });
    setEditedContent(text);
    setEditedTitle(title);
    setSummarisedContent(null);
    setShowOriginal(false);

    // Create project early so source edits can be persisted via PUT
    const id = await createProjectEarly(title, "url", text);
    if (id) {
      setProjectId(id);
      if (text.length > CHAR_SUMMARISE) triggerSummarise(id);
    }
  }

  async function handleConfirmUrl() {
    setCreating(true);

    if (projectId) {
      // Save any last-second edits, then generate
      try {
        await fetch(`/api/projects/${projectId}/source`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceContent: editedContent, title: editedTitle }),
        });
      } catch {
        // Continue even if save fails
      }
      fetch(`/api/projects/${projectId}/generate`, { method: "POST" }).catch(() => null);
      router.push(`/dashboard/projects/${projectId}/processing`);
      return;
    }

    // Fallback: early creation failed, create now
    await createProject(
      editedTitle || scrapedData?.title || "",
      "url",
      editedContent || scrapedData?.text || ""
    );
  }

  function handleUrlReset() {
    setScrapedData(null);
    setProjectId(null);
    setEditedContent("");
    setEditedTitle("");
    setSourcePreviewOpen(false);
    setSummarisedContent(null);
    setShowOriginal(false);
  }

  // Audio handlers
  async function handleAudioReady({ transcript, fileId, title }: { transcript: string; fileId: string; title: string }) {
    setTranscriptData({ transcript, fileId, title });
    setEditedContent(transcript);
    setEditedTitle(title);
    setSummarisedContent(null);
    setShowOriginal(false);

    const id = await createProjectEarly(title, "audio", transcript, fileId, transcript);
    if (id) {
      setProjectId(id);
      if (transcript.length > CHAR_SUMMARISE) triggerSummarise(id);
    }
  }

  async function handleConfirmAudio() {
    setCreating(true);

    if (projectId) {
      try {
        await fetch(`/api/projects/${projectId}/source`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceContent: editedContent, title: editedTitle }),
        });
      } catch {
        // Continue
      }
      fetch(`/api/projects/${projectId}/generate`, { method: "POST" }).catch(() => null);
      router.push(`/dashboard/projects/${projectId}/processing`);
      return;
    }

    // Fallback
    await createProject(
      editedTitle || transcriptData?.title || "",
      "audio",
      editedContent || transcriptData?.transcript || "",
      transcriptData?.fileId || "",
      editedContent || transcriptData?.transcript || ""
    );
  }

  function handleAudioReset() {
    setTranscriptData(null);
    setAudioResetKey((k) => k + 1);
    setProjectId(null);
    setEditedContent("");
    setEditedTitle("");
    setSourcePreviewOpen(false);
    setSummarisedContent(null);
    setShowOriginal(false);
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
    // URL: scraped preview with source edit panel
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
              <p className="text-sm font-semibold text-white">{editedTitle || "(No title)"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Extracted content</p>
              <p className="text-sm text-slate-300 leading-relaxed">{truncate(editedContent, 240)}</p>
              <p className={`text-xs mt-1.5 ${charCountClass(editedContent.length)}`}>
                {editedContent.length.toLocaleString()} characters
              </p>
            </div>
          </div>

          <SourcePreviewPanel
            editedContent={editedContent}
            editedTitle={editedTitle}
            onContentChange={setEditedContent}
            onTitleChange={setEditedTitle}
            onBlur={handleSourceBlur}
            open={sourcePreviewOpen}
            onToggle={() => setSourcePreviewOpen((v) => !v)}
            saving={savingSource}
            summarising={summarising}
            summarisedContent={summarisedContent}
            showOriginal={showOriginal}
            onToggleOriginal={() => setShowOriginal((v) => !v)}
          />

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
              onClick={handleUrlReset}
              disabled={creating}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors py-1 text-center"
            >
              Try a different URL
            </button>
          </div>
        </GlassCard>
      );
    }

    // Audio: transcript preview with source edit panel
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
              <p className="text-sm font-semibold text-white">{editedTitle}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transcript</p>
              <p className="text-sm text-slate-300 leading-relaxed">{truncate(editedContent, 240)}</p>
              <p className={`text-xs mt-1.5 ${charCountClass(editedContent.length)}`}>
                {editedContent.length.toLocaleString()} characters
              </p>
            </div>
          </div>

          <SourcePreviewPanel
            editedContent={editedContent}
            editedTitle={editedTitle}
            onContentChange={setEditedContent}
            onTitleChange={setEditedTitle}
            onBlur={handleSourceBlur}
            open={sourcePreviewOpen}
            onToggle={() => setSourcePreviewOpen((v) => !v)}
            saving={savingSource}
            summarising={summarising}
            summarisedContent={summarisedContent}
            showOriginal={showOriginal}
            onToggleOriginal={() => setShowOriginal((v) => !v)}
          />

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

    // Text: live channel hint + character count with summarisation banner
    if (sourceType === "text" && textContent.trim().length > 30) {
      return (
        <GlassCard padding="md" className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Ready to generate</p>
            <p className={`text-xs mt-0.5 ${charCountClass(textContent.length)}`}>
              {textContent.trim().length.toLocaleString()} characters
              {textContent.length >= CHAR_LIMIT && " — will be truncated at 12,000"}
            </p>
          </div>

          {textContent.length > CHAR_SUMMARISE && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 leading-relaxed">
              Content is large — it will be summarised before generation to improve output quality.
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Will generate for</p>
            <ChannelBadges />
          </div>
          <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
            <p className="text-xs text-slate-400">✓ Facebook — 400–600 word post with CTA</p>
            <p className="text-xs text-slate-400">✓ TikTok — scene-by-scene script [Scene 1]…</p>
            <p className="text-xs text-slate-400">✓ Instagram — 10 slides + caption + 30 hashtags</p>
            <p className="text-xs text-slate-400">✓ LinkedIn — professional article post</p>
            <p className="text-xs text-slate-400">✓ Twitter — tweet thread (N/ format)</p>
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
          <p className="text-xs text-slate-500 mb-2.5">Will generate content for 5 channels:</p>
          <ChannelBadges />
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-slate-400">✓ Facebook — 400–600 word post with CTA</p>
          <p className="text-xs text-slate-400">✓ TikTok — scene-by-scene script [Scene 1]…</p>
          <p className="text-xs text-slate-400">✓ Instagram — 10 slides + caption + 30 hashtags</p>
          <p className="text-xs text-slate-400">✓ LinkedIn — professional article post</p>
          <p className="text-xs text-slate-400">✓ Twitter — tweet thread (N/ format)</p>
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
          Choose a source and generate social media content for 5 channels in seconds.
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
