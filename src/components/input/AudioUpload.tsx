"use client";

import { useState, useRef, useCallback } from "react";
import { Mic } from "lucide-react";
import { deriveTitle } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "transcribing" | "done" | "error";

interface AudioUploadProps {
  onTranscriptReady: (result: { transcript: string; fileId: string; title: string }) => void;
  disabled?: boolean;
}

export function AudioUpload({ onTranscriptReady, disabled }: AudioUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      setUploadState("uploading");
      setErrorMessage("");

      const formData = new FormData();
      formData.append("file", file);

      let fileId: string;
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error ?? "Upload failed.");
          setUploadState("error");
          return;
        }
        fileId = data.fileId;
      } catch {
        setErrorMessage("Upload failed. Please try again.");
        setUploadState("error");
        return;
      }

      setUploadState("transcribing");

      let transcriptId: string;
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error ?? "Transcription submission failed.");
          setUploadState("error");
          return;
        }
        transcriptId = data.transcriptId;
      } catch {
        setErrorMessage("Transcription submission failed. Please try again.");
        setUploadState("error");
        return;
      }

      const MAX_ATTEMPTS = 60;
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));

        try {
          const res = await fetch(`/api/transcribe/${transcriptId}`);
          const data = await res.json();

          if (data.status === "completed" && data.text) {
            const title = deriveTitle("audio", "", file.name);
            setUploadState("done");
            onTranscriptReady({ transcript: data.text, fileId, title });
            return;
          }

          if (data.status === "error") {
            setErrorMessage("Transcription failed. Please try a different audio file.");
            setUploadState("error");
            return;
          }
        } catch {
          // Network hiccup — keep polling
        }
      }

      setErrorMessage("Transcription timed out. Please try again.");
      setUploadState("error");
    },
    [disabled, onTranscriptReady]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  if (uploadState === "uploading") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
        <p className="text-sm text-slate-300">Uploading audio…</p>
      </div>
    );
  }

  if (uploadState === "transcribing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />
        <p className="text-sm text-slate-300">Transcribing… this may take a minute.</p>
        <p className="text-xs text-slate-500">Polling every 5 seconds</p>
      </div>
    );
  }

  if (uploadState === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-10 text-center">
        <p className="text-sm font-medium text-emerald-400">Transcription complete!</p>
        <p className="text-xs text-slate-400">Creating your project…</p>
      </div>
    );
  }

  if (uploadState === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/5 p-8 text-center">
        <p className="text-sm text-red-400">{errorMessage}</p>
        <button
          onClick={() => {
            setUploadState("idle");
            setErrorMessage("");
          }}
          className="text-xs text-slate-400 underline hover:text-white transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  // idle — drag-and-drop zone
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={[
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
        isDragging
          ? "border-violet-500/60 bg-violet-500/5 shadow-[0_0_30px_rgba(139,92,246,0.15)]"
          : "border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] hover:border-violet-500/40",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <Mic className="h-10 w-10 text-slate-500" strokeWidth={1.5} />
      <div>
        <p className="text-sm font-medium text-slate-300">
          Drag &amp; drop an audio file or{" "}
          <span className="text-violet-400 underline">browse</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">MP3, WAV, M4A — max 25 MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-m4a"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
}
