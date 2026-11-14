import { adminClient } from "./supabase/admin";
import { getUser } from "./supabase/server";

/** Server-side admin check: role is read from the database, never from the client. */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) return null;
  const { data } = await adminClient().from("profiles").select("role, account_status").eq("id", user.id).maybeSingle();
  return data?.role === "admin" && data.account_status === "active" ? user : null;
}
