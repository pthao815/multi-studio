"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ID } from "appwrite";
import { toast } from "sonner";
import { account } from "@/lib/appwrite";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      try { await account.deleteSession("current"); } catch { /* no active session */ }
      await account.create(ID.unique(), email, password);
      await account.createEmailPasswordSession(email, password);
      const { jwt } = await account.createJWT();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt }),
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 animate-fadeInUp">
      <GlassCard padding="lg" className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
        <p className="text-slate-400 text-sm mb-6">Start generating content in seconds</p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200"
              placeholder="Min. 8 characters"
            />
          </div>

          <GradientButton
            type="button"
            onClick={handleSubmit}
            loading={loading}
            disabled={loading}
            size="md"
            className="w-full"
          >
            {loading ? "Creating account…" : "Sign up"}
          </GradientButton>
        </div>

        <p className="mt-5 text-sm text-slate-500 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">
            Log in
          </a>
        </p>
      </GlassCard>
    </div>
  );
}
