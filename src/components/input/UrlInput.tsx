"use client";

import { useState } from "react";
import { toast } from "sonner";
import { GradientButton } from "@/components/ui/GradientButton";

interface UrlInputProps {
  onSuccess: (result: { title: string; text: string }) => void;
  disabled?: boolean;
}

export function UrlInput({ onSuccess, disabled }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleScrape() {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Please enter a URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to scrape URL.");
        return;
      }

      onSuccess({ title: data.title, text: data.text });
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleScrape()}
        placeholder="https://example.com/article"
        disabled={disabled || loading}
        className="w-full bg-white/5 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-150 disabled:opacity-50"
      />
      <GradientButton
        onClick={handleScrape}
        loading={loading}
        disabled={disabled || loading}
        size="md"
        className="w-full"
      >
        {loading ? "Scraping…" : "Scrape URL"}
      </GradientButton>
    </div>
  );
}
