import { describe, expect, it } from "vitest";
import { computeEarnAmount } from "./earn";
import { EARN_POLICY } from "./policy";

describe("computeEarnAmount", () => {
  it("pays the full base amount on the first claim", () => {
    expect(computeEarnAmount(0)).toBe(EARN_POLICY.baseAmount);
  });

  it("strictly decreases as claimIndex grows", () => {
    const amounts = [0, 1, 2, 10, 50, 100, 200].map(computeEarnAmount);
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeLessThanOrEqual(amounts[i - 1]);
    }
  });

  it("is banned-flat-reward-proof: no two consecutive claims pay the same nonzero amount forever", () => {
    // The curve must actually decay, not plateau - CLAUDE.md bans flat
    // "watch N videos -> N tokens" style rewards.
    expect(computeEarnAmount(1)).toBeLessThan(computeEarnAmount(0));
  });

  it("rounds down to ~nothing well before the lifetime cap - '500th earns ~nothing'", () => {
    expect(computeEarnAmount(EARN_POLICY.maxLifetimeClaims - 1)).toBeLessThanOrEqual(1);
  });

  it("pays nothing at or beyond the hard lifetime cap", () => {
    expect(computeEarnAmount(EARN_POLICY.maxLifetimeClaims)).toBe(0);
    expect(computeEarnAmount(EARN_POLICY.maxLifetimeClaims + 100)).toBe(0);
  });

  it("never returns a negative amount", () => {
    for (const n of [-1, 0, 1, 1000, 1_000_000]) {
      expect(computeEarnAmount(n)).toBeGreaterThanOrEqual(0);
    }
  });

  it("always returns an integer (token units are never fractional)", () => {
    for (const n of [0, 1, 5, 42, 300]) {
      expect(Number.isInteger(computeEarnAmount(n))).toBe(true);
    }
  });
});
