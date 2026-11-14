import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AccountList from "@/components/AccountList";
import ProofForm from "@/components/ProofForm";
import { ButtonLink } from "@/components/ui";
import { isTier, tierLabel } from "@/lib/entitlements";
import { PAYMENT_ACCOUNTS } from "@/lib/payment-accounts";
import { createClient, getUser } from "@/lib/supabase/server";

export const metadata = { title: "Payment — PHOTOBOOTH STUDIO" };
export const dynamic = "force-dynamic";
const idr = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default async function PayPage({ params }: { params: { orderId: string } }) {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/pay/${params.orderId}`)}`);
  const { data: tx } = await createClient().from("transactions").select("order_id,to_tier,amount,status,method,sender_name,reject_reason").eq("order_id", params.orderId).maybeSingle();
  if (!tx || !isTier(tx.to_tier)) notFound();
  const method = PAYMENT_ACCOUNTS.find((a) => a.id === tx.method)?.label;

  return (
    <section className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{tierLabel(tx.to_tier)} plan</h1>
      <p className="mt-1 text-muted">Order code <span className="font-mono">{tx.order_id}</span></p>

      {tx.status === "paid" && <div className="mt-6 rounded-xl border border-line bg-card p-5"><p className="font-semibold">Payment confirmed. Your plan is active.</p><div className="mt-4"><ButtonLink href="/studio">Open studio</ButtonLink></div></div>}

      {tx.status === "review" && (
        <div className="mt-6 rounded-xl border border-line bg-card p-5" role="status">
          <p className="font-semibold">We received your proof.</p>
          <p className="mt-2 text-sm text-muted">We check each payment by hand against our account, so this can take a little while. Your plan activates once it is confirmed. Sent from {tx.sender_name} to {method}.</p>
          <p className="mt-3 text-sm"><Link className="underline" href="/account">Check status in My account</Link></p>
        </div>
      )}

      {(tx.status === "failed" || tx.status === "cancelled" || tx.status === "expired") && (
        <div className="mt-6 rounded-xl border border-line bg-card p-5">
          <p className="font-semibold">{tx.status === "failed" ? "We could not confirm this payment." : "This order is closed."}</p>
          {tx.reject_reason && <p className="mt-2 text-sm text-muted">Reason: {tx.reject_reason}</p>}
          <div className="mt-4"><ButtonLink href="/upgrade" variant="outline">Start a new order</ButtonLink></div>
        </div>
      )}

      {tx.status === "pending" && (
        <>
          <div className="mt-6 rounded-xl border border-line bg-card p-5">
            <p className="text-sm text-muted">Transfer exactly</p>
            <p className="font-display text-3xl font-extrabold">{idr(tx.amount)}</p>
            <p className="mt-2 text-sm text-muted">to one of the accounts below. If your bank or GoPay has a note field, write <span className="font-mono">{tx.order_id}</span>.</p>
          </div>
          <div className="mt-4"><AccountList /></div>
          <h2 className="mt-8 font-display text-lg font-bold">After you pay, send your proof</h2>
          <p className="mt-1 text-sm text-muted">Your plan is only activated after we receive your proof and confirm the payment.</p>
          <div className="mt-4"><ProofForm orderId={tx.order_id} userId={user.id} /></div>
        </>
      )}
    </section>
  );
}
