import StudioApp from "@/components/studio/StudioApp";
import { isTier, type Tier } from "@/lib/entitlements";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createClient, getUser } from "@/lib/supabase/server";

export const metadata = { title: "Studio — PHOTOBOOTH STUDIO" };

export default async function StudioPage() {
  const configured = supabaseConfigured();
  const user = await getUser();
  let tier: Tier = "free";
  if (user) {
    const { data } = await createClient().from("memberships").select("tier").eq("user_id", user.id).maybeSingle();
    if (isTier(data?.tier)) tier = data.tier;
  }
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <h1 className="text-center font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Photobooth studio</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-muted">Take up to 3 photos, pick a look and layout, add stickers, then download. Photos are processed on your device and are not uploaded. They are lost if you close or refresh this tab.</p>
      <div className="mt-8"><StudioApp configured={configured} signedIn={!!user} tier={tier} /></div>
    </section>
  );
}
