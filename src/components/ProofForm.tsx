"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PAYMENT_ACCOUNTS } from "@/lib/payment-accounts";
import { createClient } from "@/lib/supabase/client";

const field = "mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base";
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default function ProofForm({ orderId, userId }: { orderId: string; userId: string }) {
  const router = useRouter();
  const [method, setMethod] = useState("bri");
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!file) return setErr("Choose the image of your payment proof.");
    const ext = TYPES[file.type];
    if (!ext) return setErr("Use a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setErr("The image is larger than 5 MB.");
    if (name.trim().length < 2) return setErr("Enter the name on the account you paid from.");
    setBusy(true);
    const path = `${userId}/${orderId}-${Date.now()}.${ext}`;
    const up = await createClient().storage.from("payment-proofs").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setBusy(false); return setErr("The upload failed. Please try again."); }
    const res = await fetch("/api/payments/proof", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: orderId, path, method, sender_name: name.trim() }) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setErr(data.error ?? "Could not send your proof.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm">I paid to
        <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>{PAYMENT_ACCOUNTS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
      </label>
      <label className="block text-sm">Name on the account or GoPay you paid from
        <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} className={field} />
      </label>
      <label className="block text-sm">Payment proof (screenshot or photo, max 5 MB)
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={field} />
      </label>
      <p className="text-xs text-muted">Only you and the shop owner can see this image.</p>
      {err && <p role="alert" className="text-sm text-accent">{err}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg disabled:opacity-50">{busy ? "Sending…" : "Send proof"}</button>
    </form>
  );
}
