import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { isTier, tierLabel } from "@/lib/entitlements";
import { createClient, getUser } from "@/lib/supabase/server";

export const metadata = { title: "My account — PHOTOBOOTH STUDIO" };
const idr = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const date = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function AccountPage({ searchParams }: { searchParams: { order?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");
  const sb = createClient();
  const [{ data: m }, { data: prof }, { data: txs }, { data: events }, { count }] = await Promise.all([
    sb.from("memberships").select("tier").eq("user_id", user.id).maybeSingle(),
    sb.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    sb.from("transactions").select("order_id,to_tier,amount,status,created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("membership_events").select("id,from_tier,to_tier,reason,created_at").order("created_at", { ascending: false }).limit(50),
    sb.from("free_sessions").select("id", { count: "exact", head: true }),
  ]);
  const tier = isTier(m?.tier) ? m.tier : "free";
  const cell = "py-2 pr-4 text-sm";
  const STATUS: Record<string, string> = { pending: "Waiting for payment", review: "Waiting for confirmation", paid: "Paid", failed: "Not confirmed", expired: "Expired", cancelled: "Cancelled" };

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">My account</h1>
      <p className="mt-1 text-muted">{user.email}</p>
      {searchParams.order && <p role="status" className="mt-4 rounded-lg border border-line bg-card p-3 text-sm">Thanks. Your plan updates as soon as the payment is confirmed. If it still shows the old plan, refresh in a minute.</p>}

      <div className="mt-8 rounded-2xl border border-line bg-card p-6">
        <h2 className="font-display text-lg font-bold">My membership</h2>
        <p className="mt-2 text-2xl font-extrabold">{tierLabel(tier)}</p>
        {tier === "free" && <p className="mt-1 text-sm text-muted">Your free sessions: {Math.max(2 - (count ?? 0), 0)}/2 remaining.</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/studio">Open studio</ButtonLink>
          {tier !== "lifetime" && <ButtonLink href="/upgrade" variant="outline">Upgrade</ButtonLink>}
          {prof?.role === "admin" && <ButtonLink href="/admin" variant="ghost">Admin</ButtonLink>}
        </div>
      </div>

      <h2 className="mt-10 font-display text-lg font-bold">Purchase history</h2>
      {!txs?.length ? <p className="mt-2 text-sm text-muted">No purchases yet.</p> : (
        <div className="mt-2 overflow-x-auto"><table className="w-full text-left"><thead><tr className="text-xs text-muted"><th className={cell}>Date</th><th className={cell}>Plan</th><th className={cell}>Amount</th><th className={cell}>Status</th></tr></thead>
          <tbody>{txs.map((t) => <tr key={t.order_id} className="border-t border-line"><td className={cell}>{date(t.created_at)}</td><td className={cell}>{tierLabel(t.to_tier)}</td><td className={cell}>{idr(t.amount)}</td><td className={cell}>{STATUS[t.status] ?? t.status}{["pending", "review"].includes(t.status) && <> · <Link className="underline" href={`/pay/${t.order_id}`}>open</Link></>}</td></tr>)}</tbody></table></div>
      )}

      <h2 className="mt-10 font-display text-lg font-bold">Upgrade history</h2>
      {!events?.length ? <p className="mt-2 text-sm text-muted">No upgrades yet.</p> : (
        <ul className="mt-2 space-y-1 text-sm">{events.map((e) => <li key={e.id}>{date(e.created_at)}: {tierLabel(e.from_tier ?? "free")} to {tierLabel(e.to_tier)}{e.reason === "admin" ? " (set by support)" : ""}</li>)}</ul>
      )}

      <form action="/auth/signout" method="post" className="mt-12"><button type="submit" className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold hover:bg-fg/5">Log out</button></form>
      <p className="mt-4 text-sm text-muted"><Link href="/" className="underline">Back to home</Link></p>
    </section>
  );
}
