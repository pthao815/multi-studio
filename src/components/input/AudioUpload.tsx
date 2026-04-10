"use client";

import { useState, useRef, useCallback } from "react";
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

      // Step 1: Upload file
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

      // Step 2: Submit transcription job
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

      // Step 3: Poll for transcription result (max 60 attempts = 5 minutes)
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
          // status === "processing" — keep polling
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
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
        <p className="text-sm text-slate-300">Uploading audio…</p>
      </div>
    );
  }

  if (uploadState === "transcribing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-10 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-violet-400" />
        <p className="text-sm text-slate-300">Transcribing… this may take a minute.</p>
        <p className="text-xs text-slate-500">Polling every 5 seconds</p>
      </div>
    );
  }

  if (uploadState === "done") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-900/20 p-10 text-center">
        <p className="text-sm font-medium text-emerald-400">Transcription complete!</p>
        <p className="text-xs text-slate-400">Creating your project…</p>
      </div>
    );
  }

  if (uploadState === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-700/50 bg-red-900/20 p-8 text-center">
        <p className="text-sm text-red-400">{errorMessage}</p>
        <button
          onClick={() => {
            setUploadState("idle");
            setErrorMessage("");
          }}
          className="text-xs text-slate-400 underline hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  // idle state — drag-and-drop zone
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
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
        isDragging
          ? "border-violet-500 bg-violet-900/20"
          : "border-slate-600 bg-slate-800/30 hover:border-slate-500",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <svg
        className="h-10 w-10 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
        />
      </svg>
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
