"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const STEPS = [
  "Analysing content",
  "Drafting Facebook",
  "Drafting TikTok",
  "Drafting Instagram",
];

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;
// Advance the animated step every 3 polls
const POLLS_PER_STEP = 3;

export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pollCountRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      pollCountRef.current += 1;

      // Advance animated step every 3 polls (capped at last step)
      const nextStep = Math.min(
        Math.floor(pollCountRef.current / POLLS_PER_STEP),
        STEPS.length - 1
      );
      setActiveStep(nextStep);

      // Check for timeout
      if (pollCountRef.current >= MAX_POLLS) {
        clearInterval(interval);
        setError("Generation failed — timed out after too many attempts.");
        return;
      }

      try {
        const res = await fetch(`/api/projects/${id}/status`);
        const data = await res.json();

        if (data.status === "done") {
          clearInterval(interval);
          router.push(`/dashboard/projects/${id}`);
        } else if (data.status === "failed") {
          clearInterval(interval);
          setError("Generation failed. Please try again.");
        }
      } catch {
        // Network error — keep polling until MAX_POLLS
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [id, router]);

  return (
    <ErrorBoundary>
    <div className="flex flex-1 items-center justify-center py-16 px-4">
      {error ? (
        <div className="text-center space-y-4">
          <div className="text-red-400 text-5xl">✕</div>
          <h1 className="text-xl font-semibold text-white">Generation failed</h1>
          <p className="text-slate-400 text-sm">{error}</p>
          <Link
            href="/dashboard"
            className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to dashboard
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Generating your content</h1>
            <p className="text-slate-400 text-sm mt-1">This usually takes 10–15 seconds</p>
          </div>

          <ol className="space-y-4">
            {STEPS.map((step, index) => {
              const isDone = index < activeStep;
              const isActive = index === activeStep;

              return (
                <li key={step} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-colors duration-500 ${
                      isDone
                        ? "bg-indigo-600 text-white"
                        : isActive
                        ? "bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/50"
                        : "bg-white/[0.06] text-slate-500"
                    }`}
                  >
                    {isDone ? "✓" : index + 1}
                  </div>

                  <span
                    className={`text-sm font-medium transition-colors duration-500 ${
                      isDone
                        ? "text-indigo-400"
                        : isActive
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {step}
                  </span>

                  {isActive && (
                    <svg
                      className="ml-auto w-4 h-4 text-indigo-400 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}
