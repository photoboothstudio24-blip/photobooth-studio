import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isTier, type Tier } from "@/lib/entitlements";
import { upgradeAmount } from "@/lib/pricing";
import { rateLimit } from "@/lib/ratelimit";
import { adminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Creates (or reuses) an open order for the requested plan. The price comes from the database, never from the request. */
export async function POST(req: Request) {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return fail("Checkout is not configured yet.", 503);
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return fail("Please log in first.", 401);
  if (!rateLimit(`checkout:${user.id}`, 5, 60_000)) return fail("Too many attempts. Try again in a minute.", 429);

  const body = await req.json().catch(() => null);
  const to = body?.tier;
  if (!isTier(to) || to === "free") return fail("Unknown plan.", 400);

  const db = adminClient();
  const [{ data: m }, { data: p }, { data: prices }] = await Promise.all([
    db.from("memberships").select("tier").eq("user_id", user.id).maybeSingle(),
    db.from("profiles").select("account_status").eq("id", user.id).maybeSingle(),
    db.from("upgrade_prices").select("from_tier,to_tier,amount"),
  ]);
  if (p?.account_status !== "active") return fail("This account cannot make purchases.", 403);
  const from: Tier = isTier(m?.tier) ? m.tier : "free";
  const amount = upgradeAmount(from, to, prices ?? []);
  if (amount === null) return fail("You already have this plan or a higher one.", 409);

  const { data: open } = await db.from("transactions").select("id,order_id,status,amount,created_at,proof_path").eq("user_id", user.id).eq("to_tier", to).in("status", ["pending", "review"]).maybeSingle();
  if (open) {
    const stale = open.status === "pending" && !open.proof_path && Date.now() - new Date(open.created_at).getTime() > 24 * 3600 * 1000;
    if (open.status === "review" || (!stale && open.amount === amount)) return NextResponse.json({ order_id: open.order_id });
    await db.from("transactions").update({ status: "expired" }).eq("id", open.id).eq("status", "pending");
  }

  for (let i = 0; i < 3; i++) {
    const orderId = `PBS-${randomBytes(4).toString("hex").toUpperCase()}`;
    const { error } = await db.from("transactions").insert({ order_id: orderId, user_id: user.id, from_tier: from, to_tier: to, amount });
    if (!error) return NextResponse.json({ order_id: orderId });
    if (error.code !== "23505") break; // 23505 on a fresh code: retry; any other error: stop
  }
  return fail("Could not create your order. Please try again.", 500);
}
