import type { Adjust } from "./imaging";

export type Tier = "free" | "standard" | "premium" | "lifetime";
export const TIER_RANK: Record<Tier, number> = { free: 0, standard: 1, premium: 2, lifetime: 3 };
export const isTier = (v: unknown): v is Tier => typeof v === "string" && v in TIER_RANK;
export const atLeast = (t: Tier, min: Tier) => TIER_RANK[t] >= TIER_RANK[min];
export const tierLabel = (t: Tier) => t.charAt(0).toUpperCase() + t.slice(1);

const S: Tier = "standard", P: Tier = "premium";
export const FILTER_MIN: Record<string, Tier> = {
  vintage: S, retro: S, film: S, polaroid: S, cinematic: S, pastel: S, "soft-pink": P, y2k: P, dreamy: P, "high-contrast": P, "soft-blur": P,
};
export const filterMin = (id: string): Tier => FILTER_MIN[id] ?? "free";
export const TEMPLATE_MIN: Record<string, Tier> = { birthday: S, friendship: S, family: S, travel: S, wedding: P, graduation: P, party: P };
export const templateMin = (id: string): Tier => TEMPLATE_MIN[id] ?? "free";
export const STICKER_MIN: Record<string, Tier> = { Love: "free", Stars: "free", Cute: S, Birthday: S, Flowers: S, Wedding: P, Retro: P };
export const ADJUST_MIN: Record<keyof Adjust, Tier> = { brightness: "free", contrast: "free", saturation: "free", exposure: S, temperature: S, sharpness: P, blur: P, vignette: P, grain: P };

/** Lifetime currently has the same feature set as Premium; Lifetime-only features are not defined yet. */
export function entitlements(t: Tier) {
  return { png: atLeast(t, S), maxScale: atLeast(t, P) ? 3 : 2, customColors: atLeast(t, P), share: atLeast(t, S) };
}
