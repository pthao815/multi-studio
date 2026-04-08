"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ID } from "appwrite";
import { account, databases, DB_ID, PROJECTS_COL } from "@/lib/appwrite";
import { GlassCard } from "@/components/ui/GlassCard";
import { SourceTypeSelector, type SourceType } from "@/components/input/SourceTypeSelector";
import { UrlInput } from "@/components/input/UrlInput";

export default function NewProjectPage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [userId, setUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    account.get().then((user) => setUserId(user.$id)).catch(() => router.push("/login"));
  }, [router]);

  async function handleUrlSuccess({ title, text }: { title: string; text: string }) {
    if (!userId) return;
    setCreating(true);

    try {
      const now = new Date().toISOString();
      const doc = await databases.createDocument(DB_ID, PROJECTS_COL, ID.unique(), {
        userId,
        title,
        sourceType: "url",
        sourceContent: text,
        audioFileId: "",
        transcription: "",
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });

      // Fire generation — route built in Milestone 6
      fetch(`/api/projects/${doc.$id}/generate`, { method: "POST" }).catch(() => null);

      router.push(`/dashboard/projects/${doc.$id}/processing`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project.";
      toast.error(message);
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-2">New Project</h1>
      <p className="text-slate-400 text-sm mb-8">
        Choose a source and generate social media content in seconds.
      </p>

      <GlassCard className="p-6 flex flex-col gap-6">
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
            <p className="text-slate-500 text-sm">Text input — coming in Milestone 4.</p>
          )}

          {sourceType === "audio" && (
            <p className="text-slate-500 text-sm">Audio upload — coming in Milestone 5.</p>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
