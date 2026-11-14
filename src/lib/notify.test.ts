import { describe, expect, it } from "vitest";
import { proofMessage } from "./notify";

describe("proofMessage", () => {
  it("includes order, plan, amount and admin link, but no personal data", () => {
    const m = proofMessage({ order: "PBS-1A2B3C4D", plan: "Premium", amount: 19000, site: "https://x.com" });
    expect(m).toContain("PBS-1A2B3C4D");
    expect(m).toContain("Premium");
    expect(m).toContain("19.000");
    expect(m).toContain("https://x.com/admin");
  });
});
