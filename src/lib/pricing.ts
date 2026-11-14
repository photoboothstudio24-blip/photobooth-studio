import { TIER_RANK, type Tier } from "./entitlements";

export type PriceRow = { from_tier: string; to_tier: string; amount: number };
/** Price in IDR for going from `from` to `to`, or null if that is not an upgrade. Table comes from the database. */
export function upgradeAmount(from: Tier, to: Tier, table: PriceRow[]): number | null {
  if (TIER_RANK[to] <= TIER_RANK[from]) return null;
  return table.find((r) => r.from_tier === from && r.to_tier === to)?.amount ?? null;
}
