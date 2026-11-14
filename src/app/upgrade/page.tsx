import CheckoutButton from "@/components/CheckoutButton";
import { isTier, tierLabel, type Tier } from "@/lib/entitlements";
import { PLANS } from "@/lib/data";
import { upgradeAmount } from "@/lib/pricing";
import { createClient, getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Upgrade — PHOTOBOOTH STUDIO" };
const idr = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default async function UpgradePage({ searchParams }: { searchParams: { plan?: string } }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/upgrade");
  const sb = createClient();
  const [{ data: m }, { data: prices }] = await Promise.all([sb.from("memberships").select("tier").eq("user_id", user.id).maybeSingle(), sb.from("upgrade_prices").select("from_tier,to_tier,amount")]);
  const tier: Tier = isTier(m?.tier) ? m.tier : "free";
  return (
    <section className="mx-auto max-w-4xl px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Upgrade</h1>
      <p className="mt-2 text-muted">You have {tierLabel(tier)}. One-time payment, no monthly fees. You only see upgrades you can buy; the price shown is what you pay.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {PLANS.filter((p) => p.id !== "free").map((p) => {
          const amount = upgradeAmount(tier, p.id as Tier, prices ?? []);
          return (
            <article key={p.id} className={`rounded-2xl border bg-card p-6 ${searchParams.plan === p.id ? "border-accent" : "border-line"}`}>
              <h2 className="font-display font-bold">{p.name}</h2>
              <p className="mt-2 font-display text-2xl font-extrabold">{amount === null ? "Included" : idr(amount)}</p>
              <p className="mt-1 text-sm text-muted">{p.tagline}</p>
              <div className="mt-5">{amount === null ? <p className="text-sm text-muted">You already have this.</p> : <CheckoutButton tier={p.id} label={`Buy for ${idr(amount)}`} primary={searchParams.plan === p.id} />}</div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">You pay by bank transfer or GoPay, then upload your payment proof. Your plan activates after we confirm the payment by hand, which can take a little while.</p>
    </section>
  );
}
