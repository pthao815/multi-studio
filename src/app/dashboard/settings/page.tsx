"use client";

import { useEffect, useState, KeyboardEvent } from "react";
import { Query } from "appwrite";
import { toast } from "sonner";
import { account, databases, DB_ID, PROFILES_COL } from "@/lib/appwrite";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import type { BrandVoice } from "@/types";

const BRAND_VOICES: { value: BrandVoice; label: string; description: string }[] = [
  { value: "energetic", label: "Energetic", description: "High energy, action-oriented, enthusiastic" },
  { value: "educational", label: "Educational", description: "Informative, clear, structured insights" },
  { value: "funny", label: "Funny", description: "Humorous, playful, light-hearted tone" },
  { value: "calm", label: "Calm", description: "Relaxed, thoughtful, composed messaging" },
];

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [brandVoice, setBrandVoice] = useState<BrandVoice>("energetic");
  const [brandKeywords, setBrandKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const user = await account.get();
        const result = await databases.listDocuments(DB_ID, PROFILES_COL, [
          Query.equal("userId", user.$id),
        ]);
        if (result.documents.length > 0) {
          const profile = result.documents[0];
          setDisplayName(profile.displayName as string ?? "");
          const raw = profile.brandVoice;
          setBrandVoice((Array.isArray(raw) ? raw[0] : raw) as BrandVoice ?? "energetic");
          setBrandKeywords((profile.brandKeywords as string[]) ?? []);
        }
      } catch {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function addKeyword(raw: string) {
    const tag = raw.trim().slice(0, 50);
    if (!tag) return;
    if (brandKeywords.length >= 10) {
      toast.error("Maximum 10 keywords allowed.");
      return;
    }
    if (brandKeywords.includes(tag)) return;
    setBrandKeywords((prev) => [...prev, tag]);
  }

  function handleKeywordKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(keywordInput);
      setKeywordInput("");
    } else if (e.key === "Backspace" && keywordInput === "" && brandKeywords.length > 0) {
      setBrandKeywords((prev) => prev.slice(0, -1));
    }
  }

  function removeKeyword(tag: string) {
    setBrandKeywords((prev) => prev.filter((k) => k !== tag));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, brandVoice, brandKeywords }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Settings saved.");
    } catch (err) {
      console.error("Settings save error:", err);
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your profile and brand voice preferences.
        </p>
      </div>

      {/* Display name */}
      <GlassCard padding="md">
        <h2 className="text-sm font-semibold text-white mb-4">Profile</h2>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={100}
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </GlassCard>

      {/* Brand voice */}
      <GlassCard padding="md">
        <h2 className="text-sm font-semibold text-white mb-4">Brand Voice</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BRAND_VOICES.map(({ value, label, description }) => (
            <button
              key={value}
              onClick={() => setBrandVoice(value)}
              className={`text-left p-4 rounded-xl border transition-all ${
                brandVoice === value
                  ? "bg-violet-500/20 border-violet-500/50 text-white"
                  : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs mt-0.5 opacity-70">{description}</p>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Brand keywords */}
      <GlassCard padding="md">
        <h2 className="text-sm font-semibold text-white mb-1">Brand Keywords</h2>
        <p className="text-xs text-slate-500 mb-4">
          Up to 10 keywords injected into every generation. Press Enter or comma to add.
        </p>

        {/* Tag display + input */}
        <div className="flex flex-wrap gap-2 p-3 min-h-[48px] bg-white/[0.03] border border-white/[0.08] rounded-xl focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
          {brandKeywords.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium"
            >
              {tag}
              <button
                onClick={() => removeKeyword(tag)}
                className="hover:text-white transition-colors leading-none"
              >
                ×
              </button>
            </span>
          ))}
          {brandKeywords.length < 10 && (
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={handleKeywordKeyDown}
              onBlur={() => {
                if (keywordInput.trim()) {
                  addKeyword(keywordInput);
                  setKeywordInput("");
                }
              }}
              placeholder={brandKeywords.length === 0 ? "e.g. viral, trending…" : ""}
              maxLength={50}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
            />
          )}
        </div>
        <p className="text-xs text-slate-600 mt-2">{brandKeywords.length} / 10 keywords</p>
      </GlassCard>

      {/* Save */}
      <div className="flex justify-end">
        <GradientButton
          onClick={handleSave}
          loading={saving}
          disabled={saving}
          size="md"
        >
          {saving ? "Saving…" : "Save settings"}
        </GradientButton>
      </div>
    </div>
  );
}
