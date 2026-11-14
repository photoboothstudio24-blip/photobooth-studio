import { NextResponse } from "next/server";
import { tierLabel, isTier } from "@/lib/entitlements";
import { notifyOwner, proofMessage } from "@/lib/notify";
import { isPayMethod, ORDER_RE } from "@/lib/payment-accounts";
import { rateLimit } from "@/lib/ratelimit";
import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Called after the browser uploaded the proof image to the private bucket. Moves the order to "review". */
export async function POST(req: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return fail("Please log in first.", 401);
  if (!rateLimit(`proof:${user.id}`, 8, 60_000)) return fail("Too many attempts. Try again in a minute.", 429);

  const b = await req.json().catch(() => null);
  const orderId = String(b?.order_id ?? ""), path = String(b?.path ?? ""), name = String(b?.sender_name ?? "").trim();
  if (!ORDER_RE.test(orderId) || !isPayMethod(b?.method) || name.length < 2 || name.length > 60) return fail("Please fill in every field.", 400);
  if (!new RegExp(`^${user.id}/${orderId}-\\d+\\.(jpg|png|webp)$`).test(path)) return fail("Invalid file.", 400);

  const db = adminClient();
  const { data: tx } = await db.from("transactions").select("id,status,to_tier,amount").eq("order_id", orderId).eq("user_id", user.id).maybeSingle();
  if (!tx) return fail("Order not found.", 404);
  if (!["pending", "review"].includes(tx.status)) return fail("This order can no longer receive a proof.", 409);
  const { error: fileErr } = await db.storage.from("payment-proofs").createSignedUrl(path, 30);
  if (fileErr) return fail("We could not find your uploaded file. Please upload again.", 400);

  const { error } = await db.from("transactions").update({ status: "review", method: b.method, sender_name: name, proof_path: path, proof_at: new Date().toISOString() }).eq("id", tx.id).in("status", ["pending", "review"]);
  if (error) return fail("Could not save your proof. Please try again.", 500);
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;
  await notifyOwner(proofMessage({ order: orderId, plan: isTier(tx.to_tier) ? tierLabel(tx.to_tier) : tx.to_tier, amount: tx.amount, site }));
  return NextResponse.json({ ok: true });
}
