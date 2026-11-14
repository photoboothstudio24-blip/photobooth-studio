"use client";
import { useState } from "react";
import { PAYMENT_ACCOUNTS } from "@/lib/payment-accounts";

export default function AccountList() {
  const [copied, setCopied] = useState("");
  async function copy(id: string, text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1500); } catch { /* clipboard unavailable: number is visible to copy by hand */ }
  }
  return (
    <ul className="space-y-3">
      {PAYMENT_ACCOUNTS.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div><p className="text-sm font-semibold">{a.label}</p><p className="font-mono text-lg">{a.number}</p><p className="text-sm text-muted">a.n. {a.holder}</p></div>
          <button type="button" onClick={() => void copy(a.id, a.number)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:bg-fg/5">{copied === a.id ? "Copied" : "Copy"}</button>
        </li>
      ))}
    </ul>
  );
}
