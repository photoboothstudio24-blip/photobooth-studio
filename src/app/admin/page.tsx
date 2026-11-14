import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { isTier, tierLabel } from "@/lib/entitlements";
import { adminClient } from "@/lib/supabase/admin";
import { ORDER_RE, PAYMENT_ACCOUNTS } from "@/lib/payment-accounts";

export const metadata = { title: "Admin — PHOTOBOOTH STUDIO" };
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idr = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

async function setTier(fd: FormData) {
  "use server";
  const admin = await requireAdmin(); // re-checked on every action: hiding the form is not security
  const uid = String(fd.get("user")), tier = String(fd.get("tier"));
  if (!admin || !UUID.test(uid) || !isTier(tier)) return;
  const db = adminClient();
  const { data: m } = await db.from("memberships").select("tier").eq("user_id", uid).maybeSingle();
  await db.from("memberships").update({ tier, updated_at: new Date().toISOString() }).eq("user_id", uid);
  await db.from("membership_events").insert({ user_id: uid, from_tier: m?.tier ?? "free", to_tier: tier, reason: "admin" });
  await db.from("audit_logs").insert({ actor: admin.id, action: "set_tier", target: uid, detail: { from: m?.tier, to: tier } });
  revalidatePath("/admin");
}

async function setStatus(fd: FormData) {
  "use server";
  const admin = await requireAdmin();
  const uid = String(fd.get("user")), status = String(fd.get("status"));
  if (!admin || !UUID.test(uid) || uid === admin.id || !["active", "suspended"].includes(status)) return;
  const db = adminClient();
  await db.from("profiles").update({ account_status: status }).eq("id", uid);
  await db.from("audit_logs").insert({ actor: admin.id, action: "set_status", target: uid, detail: { status } });
  revalidatePath("/admin");
}

async function approve(fd: FormData) {
  "use server";
  const admin = await requireAdmin();
  const order = String(fd.get("order"));
  if (!admin || !ORDER_RE.test(order)) return;
  const db = adminClient();
  const { data: tx } = await db.from("transactions").select("status,method").eq("order_id", order).maybeSingle();
  if (tx?.status !== "review") return;
  const { data, error } = await db.rpc("activate_membership", { p_order: order, p_txn: `manual-${order}`, p_type: tx.method ?? "manual" });
  await db.from("audit_logs").insert({ actor: admin.id, action: "approve_payment", detail: { order, result: data, error: error?.message } });
  revalidatePath("/admin");
}

async function reject(fd: FormData) {
  "use server";
  const admin = await requireAdmin();
  const order = String(fd.get("order")), reason = String(fd.get("reason") ?? "").trim().slice(0, 200);
  if (!admin || !ORDER_RE.test(order)) return;
  const db = adminClient();
  await db.from("transactions").update({ status: "failed", reject_reason: reason || "Payment could not be confirmed." }).eq("order_id", order).eq("status", "review");
  await db.from("audit_logs").insert({ actor: admin.id, action: "reject_payment", detail: { order, reason } });
  revalidatePath("/admin");
}

export default async function AdminPage({ searchParams }: { searchParams: { q?: string } }) {
  if (!(await requireAdmin())) notFound();
  const db = adminClient();
  const q = (searchParams.q ?? "").replace(/[%,()*]/g, "").slice(0, 60);
  let users = db.from("profiles").select("id,email,role,account_status,created_at,memberships(tier)").order("created_at", { ascending: false }).limit(25);
  if (q) users = users.ilike("email", `%${q}%`);
  const [{ data: stats }, { data: userRows }, { data: txs }, { data: reviews }] = await Promise.all([
    db.rpc("admin_stats"),
    users,
    db.from("transactions").select("order_id,user_id,to_tier,amount,status,method,created_at").order("created_at", { ascending: false }).limit(25),
    db.from("transactions").select("order_id,user_id,from_tier,to_tier,amount,method,sender_name,proof_path,proof_at").eq("status", "review").order("proof_at", { ascending: true }),
  ]);
  const rv = reviews ?? [];
  const ids = [...new Set(rv.map((r) => r.user_id))];
  const { data: ps } = ids.length ? await db.from("profiles").select("id,email").in("id", ids) : { data: [] as { id: string; email: string }[] };
  const emailOf = new Map((ps ?? []).map((p) => [p.id, p.email]));
  const proofUrls = await Promise.all(rv.map(async (r) => (r.proof_path ? (await db.storage.from("payment-proofs").createSignedUrl(r.proof_path, 300)).data?.signedUrl ?? null : null)));
  const s = (stats ?? {}) as Record<string, number>;
  const cell = "py-2 pr-4 text-sm align-top";
  const tierOf = (m: unknown) => { const o = Array.isArray(m) ? m[0] : m; const t = (o as { tier?: string } | null)?.tier; return isTier(t) ? t : "free"; };

  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Admin</h1>
      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[["Users", s.users], ["FREE", s.free], ["STANDARD", s.standard], ["PREMIUM", s.premium], ["LIFETIME", s.lifetime], ["Transactions", s.transactions], ["Paid", s.paid], ["Revenue", idr(s.revenue ?? 0)]].map(([k, v]) => (
          <div key={String(k)} className="rounded-xl border border-line bg-card p-4"><dt className="text-xs text-muted">{k}</dt><dd className="mt-1 font-display text-xl font-bold">{v ?? 0}</dd></div>
        ))}
      </dl>

      <h2 className="mt-10 font-display text-lg font-bold">Waiting for confirmation ({rv.length})</h2>
      {rv.length === 0 ? <p className="mt-2 text-sm text-muted">No payments to check.</p> : (
        <ul className="mt-3 space-y-4">
          {rv.map((r, i) => (
            <li key={r.order_id} className="rounded-xl border border-line bg-card p-4 text-sm">
              <p className="font-semibold">{emailOf.get(r.user_id)} · {tierLabel(r.from_tier)} to {tierLabel(r.to_tier)} · {idr(r.amount)}</p>
              <p className="mt-1 text-muted">Order <span className="font-mono">{r.order_id}</span> · paid to {PAYMENT_ACCOUNTS.find((a) => a.id === r.method)?.label} · sender: {r.sender_name} · sent {r.proof_at ? new Date(r.proof_at).toLocaleString("en-GB") : "-"}</p>
              <p className="mt-2">{proofUrls[i] ? <a href={proofUrls[i]!} target="_blank" rel="noreferrer" className="underline">View proof (link expires in 5 minutes)</a> : "Proof file missing"}</p>
              <p className="mt-2 text-muted">Confirm the money really arrived in your account before approving. Do not rely on the image alone.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <form action={approve}><input type="hidden" name="order" value={r.order_id} /><button className="rounded-full bg-accent px-4 py-2 font-semibold text-accent-fg">Approve</button></form>
                <form action={reject} className="flex gap-2"><input type="hidden" name="order" value={r.order_id} /><input name="reason" maxLength={200} placeholder="Reason (shown to customer)" aria-label="Rejection reason" className="rounded-lg border border-line bg-bg px-3 py-2" /><button className="rounded-full border border-line px-4 py-2">Reject</button></form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-lg font-bold">Users</h2>
      <form className="mt-2 flex gap-2"><input name="q" defaultValue={q} placeholder="Search email" aria-label="Search email" className="rounded-lg border border-line bg-card px-3 py-2 text-sm" /><button className="rounded-full border border-line px-4 py-2 text-sm">Search</button></form>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-muted"><th className={cell}>Email</th><th className={cell}>Plan</th><th className={cell}>Status</th><th className={cell}>Set plan</th><th className={cell}>Account</th></tr></thead><tbody>
        {(userRows ?? []).map((u) => (
          <tr key={u.id} className="border-t border-line">
            <td className={cell}>{u.email}{u.role === "admin" ? " (admin)" : ""}</td>
            <td className={cell}>{tierLabel(tierOf(u.memberships))}</td>
            <td className={cell}>{u.account_status}</td>
            <td className={cell}><form action={setTier} className="flex gap-1"><input type="hidden" name="user" value={u.id} /><select name="tier" defaultValue={tierOf(u.memberships)} className="rounded border border-line bg-card px-1 py-1 text-sm">{["free", "standard", "premium", "lifetime"].map((t) => <option key={t}>{t}</option>)}</select><button className="rounded border border-line px-2 text-sm">Save</button></form></td>
            <td className={cell}><form action={setStatus}><input type="hidden" name="user" value={u.id} /><input type="hidden" name="status" value={u.account_status === "active" ? "suspended" : "active"} /><button className="rounded border border-line px-2 py-1 text-sm">{u.account_status === "active" ? "Suspend" : "Reactivate"}</button></form></td>
          </tr>
        ))}
      </tbody></table></div>

      <h2 className="mt-10 font-display text-lg font-bold">Recent transactions</h2>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-muted"><th className={cell}>Date</th><th className={cell}>Order</th><th className={cell}>Plan</th><th className={cell}>Amount</th><th className={cell}>Status</th><th className={cell}>Method</th></tr></thead><tbody>
        {(txs ?? []).map((t) => <tr key={t.order_id} className="border-t border-line"><td className={cell}>{new Date(t.created_at).toLocaleString("en-GB")}</td><td className={`${cell} font-mono text-xs`}>{t.order_id}</td><td className={cell}>{tierLabel(t.to_tier)}</td><td className={cell}>{idr(t.amount)}</td><td className={cell}>{t.status}</td><td className={cell}>{t.method ?? "-"}</td></tr>)}
      </tbody></table></div>
      <p className="mt-8 text-sm text-muted">Every plan change and suspension made here is written to the audit log. Pricing is changed in the database (plans and upgrade_prices tables).</p>
    </section>
  );
}
