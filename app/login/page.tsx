"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const markAuthenticated = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("curium-demo-authed", "true");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setTimeout(() => {
      markAuthenticated();
      router.push("/");
      setLoading(false);
    }, 800);
  };

  const handleSkip = () => {
    markAuthenticated();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="relative bg-gradient-to-br from-[#D12B8A] via-[#E46BB2] to-[#5C3C92] text-white p-8 md:p-10 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
              Curium Internal Prototype
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                Item Master Quality Check
              </h1>
              <p className="text-sm text-white/90">
                Support finance and operations leaders with timely, trusted Item Master data.
                Upload spreadsheets, run governed rules, and get AI-generated narratives in minutes.
              </p>
            </div>
          </div>
          <p className="text-xs text-white/70">
            For demonstration purposes only — not connected to production systems.
          </p>
        </div>

        <div className="p-8 md:p-10 flex flex-col gap-6 bg-white">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500">
              Use your Curium work email to access the Item Master quality dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-600 uppercase tracking-[0.14em]"
              >
                Work Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#D12B8A] focus:outline-none focus:ring-2 focus:ring-[#D12B8A]/30"
                placeholder="firstname.lastname@curium.com"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-slate-600 uppercase tracking-[0.14em]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 focus:border-[#5C3C92] focus:outline-none focus:ring-2 focus:ring-[#5C3C92]/30"
                placeholder="••••••••"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#D12B8A] focus:ring-[#D12B8A]"
              />
              Remember me
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#D12B8A] to-[#5C3C92] hover:brightness-105 hover:shadow-md hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Demo credentials
              </p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-mono text-slate-900">demo.user@curium.com</span>
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-500">Password:</span>
                  <span className="font-mono text-slate-900">CuriumDemo!23</span>
                </p>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">
                This login is for demo only and does not authenticate against real Curium systems.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm font-medium text-[#5C3C92] hover:underline"
            >
              Skip and view dashboard →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

