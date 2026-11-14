import { describe, expect, it } from "vitest";
import { upgradeAmount } from "./pricing";
import { isPayMethod, ORDER_RE } from "./payment-accounts";

describe("upgradeAmount", () => {
  const t = [{ from_tier: "standard", to_tier: "premium", amount: 10000 }, { from_tier: "free", to_tier: "standard", amount: 10000 }];
  it("uses the table and never allows downgrades", () => {
    expect(upgradeAmount("standard", "premium", t)).toBe(10000);
    expect(upgradeAmount("premium", "standard", t)).toBeNull();
    expect(upgradeAmount("premium", "premium", t)).toBeNull();
    expect(upgradeAmount("free", "lifetime", t)).toBeNull();
  });
});

describe("payment input checks", () => {
  it("accepts only known methods and order codes", () => {
    expect(isPayMethod("bri")).toBe(true);
    expect(isPayMethod("paypal")).toBe(false);
    expect(ORDER_RE.test("PBS-1A2B3C4D")).toBe(true);
    expect(ORDER_RE.test("PBS-1a2b3c4d")).toBe(false);
    expect(ORDER_RE.test("../etc")).toBe(false);
  });
});
