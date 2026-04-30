import Link from "next/link";

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Any source format",
    description: "Paste a URL, type text directly, or upload an audio file. We handle transcription, scraping, and extraction.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "5 channels at once",
    description: "Facebook, TikTok, Instagram, LinkedIn, and Twitter/X — all generated in parallel in under 15 seconds.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
    title: "Brand voice built-in",
    description: "Set your tone (energetic, educational, funny, or calm) and keywords once — every output stays on-brand.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    title: "Edit and regenerate",
    description: "Inline editing auto-saves on blur. Streaming regeneration lets you see output being written in real time.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: "Scheduling",
    description: "Set a publish date for any output. View everything in a calendar so you always know what's going out when.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
    title: "Export anywhere",
    description: "Copy to clipboard, download as .txt per channel, or grab all 5 channels at once as a structured JSON bundle.",
  },
];

const STEPS = [
  { step: "01", title: "Add your source", body: "Paste a URL, enter text, or upload an audio recording of up to any length." },
  { step: "02", title: "AI generates 5 outputs", body: "Llama 3.3 70B fires in parallel across all channels, tuned to your brand voice." },
  { step: "03", title: "Review and edit", body: "Preview each channel's formatted output, make inline edits, or regenerate with a click." },
  { step: "04", title: "Schedule and export", body: "Set publish dates, download files, or copy content straight to your clipboard." },
];

const TECH = [
  { label: "Next.js 14", color: "bg-slate-700 text-slate-200" },
  { label: "TypeScript", color: "bg-blue-900/60 text-blue-300" },
  { label: "Tailwind CSS", color: "bg-cyan-900/60 text-cyan-300" },
  { label: "Appwrite", color: "bg-pink-900/60 text-pink-300" },
  { label: "Groq / Llama 3.3", color: "bg-orange-900/60 text-orange-300" },
  { label: "AssemblyAI", color: "bg-purple-900/60 text-purple-300" },
  { label: "Vercel", color: "bg-slate-700 text-slate-200" },
  { label: "Recharts", color: "bg-green-900/60 text-green-300" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] px-6 py-4 bg-[#0a0e1a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            MultiStudio
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Powered by Llama 3.3 70B via Groq
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
          One source.
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Five channels. Instantly.
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Paste a URL, drop in text, or upload audio — MultiStudio generates
          platform-native content for Facebook, TikTok, Instagram, LinkedIn, and
          Twitter simultaneously. All tuned to your brand voice.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-violet-500/20"
          >
            Start for free
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 rounded-xl border border-white/[0.12] text-slate-300 hover:text-white hover:border-white/25 font-medium text-sm transition-colors"
          >
            See features
          </a>
        </div>

        {/* Hero visual */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] to-transparent z-10 pointer-events-none" style={{ top: "60%" }} />
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-2 mb-4">
              {["bg-red-400", "bg-yellow-400", "bg-green-400"].map((c, i) => (
                <span key={i} className={`w-3 h-3 rounded-full ${c}`} />
              ))}
            </div>
            <div className="flex gap-2 mb-4 border-b border-slate-700/50 pb-3">
              {["Facebook", "TikTok", "Instagram", "LinkedIn", "Twitter / X"].map((tab, i) => (
                <span
                  key={tab}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium ${
                    i === 0
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-500"
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {["", "", ""].map((_, i) => (
                <div
                  key={i}
                  className="h-3 rounded bg-slate-700/60 animate-pulse"
                  style={{ width: i === 2 ? "60%" : "100%" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold text-center mb-14">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map(({ step, title, body }) => (
            <div key={step} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <span className="text-3xl font-black text-violet-500/40 block mb-3">{step}</span>
              <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold text-center mb-3">Everything you need</h2>
        <p className="text-slate-400 text-center text-sm mb-14">No switching between tools. No copy-pasting prompts.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 hover:border-violet-500/30 hover:bg-white/[0.05] transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/[0.06]">
        <h2 className="text-3xl font-bold text-center mb-3">Built with proven tech</h2>
        <p className="text-slate-400 text-center text-sm mb-10">Production-grade stack. Zero infrastructure to manage.</p>
        <div className="flex flex-wrap justify-center gap-3">
          {TECH.map(({ label, color }) => (
            <span
              key={label}
              className={`px-4 py-2 rounded-full text-xs font-medium ${color}`}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/[0.06]">
        <div className="rounded-3xl bg-gradient-to-br from-violet-900/40 to-indigo-900/30 border border-violet-500/20 p-14 text-center">
          <h2 className="text-4xl font-extrabold mb-4">Ready to 5× your content output?</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm">
            Sign up in seconds. No credit card required.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-xl shadow-violet-500/20"
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            MultiStudio
          </span>
          <p className="text-xs text-slate-600">
            Built with Next.js · Appwrite · Groq
          </p>
        </div>
      </footer>
    </div>
  );
}
