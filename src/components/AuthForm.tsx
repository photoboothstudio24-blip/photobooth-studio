"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register" | "forgot" | "reset";
const TITLE: Record<Mode, string> = { login: "Log in", register: "Create your account", forgot: "Reset your password", reset: "Choose a new password" };
const CTA: Record<Mode, string> = { login: "Log in", register: "Create account", forgot: "Send reset link", reset: "Save password" };
const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/studio");
const input = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base";

export default function AuthForm({ mode, next, notice }: { mode: Mode; next?: string; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState(notice ?? "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(""); setMsg("");
    const sb = createClient();
    const origin = window.location.origin;
    try {
      if (mode === "login") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(safe(next)); router.refresh();
      } else if (mode === "register") {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(safe(next))}` } });
        if (error) throw error;
        if (data.session) { router.push(safe(next)); router.refresh(); } else setMsg("Check your email to confirm your account, then log in.");
      } else if (mode === "forgot") {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
        if (error) throw error;
        setMsg("If an account exists for that email, a reset link is on its way.");
      } else {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        router.push("/account"); router.refresh();
      }
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Something went wrong. Try again.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-16">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{TITLE[mode]}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode !== "reset" && <label className="block text-sm">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>}
        {mode !== "forgot" && <label className="block text-sm">{mode === "reset" ? "New password" : "Password"}<input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input} /></label>}
        {err && <p role="alert" className="text-sm text-accent">{err}</p>}
        {msg && <p role="status" className="text-sm text-muted">{msg}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg disabled:opacity-50">{busy ? "Please wait…" : CTA[mode]}</button>
      </form>
      <p className="mt-6 space-x-4 text-sm text-muted">
        {mode === "login" && <><Link className="underline" href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}>Create account</Link><Link className="underline" href="/forgot-password">Forgot password?</Link></>}
        {mode === "register" && <Link className="underline" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>I already have an account</Link>}
        {mode === "forgot" && <Link className="underline" href="/login">Back to log in</Link>}
      </p>
    </div>
  );
}
