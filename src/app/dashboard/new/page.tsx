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

export default function NewProjectPage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    account.get().then((user) => setUserId(user.$id)).catch(() => router.push("/login"));
  }, [router]);

  async function createProject(title: string, sourceType: "url" | "text" | "audio", sourceContent: string) {
    if (!userId) return;
    setCreating(true);
    try {
      const now = new Date().toISOString();
      const doc = await databases.createDocument(DB_ID, PROJECTS_COL, ID.unique(), {
        userId,
        title,
        sourceType,
        sourceContent,
        audioFileId: "",
        transcription: "",
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

  async function handleUrlSuccess({ title, text }: { title: string; text: string }) {
    await createProject(title, "url", text);
  }

  async function handleAudioReady({
    transcript,
    fileId,
    title,
  }: {
    transcript: string;
    fileId: string;
    title: string;
  }) {
    if (!userId) return;
    setCreating(true);
    try {
      const now = new Date().toISOString();
      const doc = await databases.createDocument(DB_ID, PROJECTS_COL, ID.unique(), {
        userId,
        title,
        sourceType: "audio",
        sourceContent: transcript,
        audioFileId: fileId,
        transcription: transcript,
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

  async function handleTextSubmit() {
    if (!textContent.trim()) {
      toast.error("Please enter some content.");
      return;
    }
    const title = deriveTitle("text", textContent);
    await createProject(title, "text", textContent);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeInUp">
      <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-2">New Project</h1>
      <p className="text-slate-400 text-sm mb-8">
        Choose a source and generate social media content in seconds.
      </p>

        <GlassCard padding="none" className="flex flex-col gap-6 p-6">
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
              <UrlInput onSuccess={handleUrlSuccess} disabled={creating || !userId} />
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
                onTranscriptReady={handleAudioReady}
                disabled={creating || !userId}
              />
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
