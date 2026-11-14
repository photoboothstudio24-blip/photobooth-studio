"use client";
import { useState } from "react";

export default function CheckoutButton({ tier, label, primary }: { tier: string; label: string; primary?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tier }) });
      const data = await res.json();
      if (!res.ok || !data.order_id) throw new Error(data.error ?? "Checkout failed.");
      window.location.href = `/pay/${data.order_id}`;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Checkout failed.");
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={() => void go()} disabled={busy} className={`w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50 ${primary ? "bg-accent text-accent-fg" : "border border-line hover:bg-fg/5"}`}>{busy ? "Please wait…" : label}</button>
      {err && <p role="alert" className="mt-2 text-sm text-accent">{err}</p>}
    </div>
  );
}
