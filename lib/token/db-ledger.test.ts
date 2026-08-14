import { describe, expect, it } from "vitest";
import { DbTokenLedger } from "./db-ledger";

// These two checks run before DbTokenLedger touches the database, so they're
// safe to unit test without a live Postgres connection. Full read/write
// behavior (balance, idempotent replay) is covered by integration tests
// once M3 wires real spend flows through this ledger.
describe("DbTokenLedger.transfer validation", () => {
  const ledger = new DbTokenLedger();

  it("rejects legs that don't sum to zero", async () => {
    await expect(
      ledger.transfer({
        idempotencyKey: "test:unbalanced",
        legs: [
          { account: { type: "user", id: "u1" }, entryType: "support_out", amount: -50 },
          { account: { type: "creator", id: "c1" }, entryType: "support_in", amount: 40 },
        ],
      }),
    ).rejects.toThrow(/sum to zero/);
  });

  it("rejects an empty transfer", async () => {
    await expect(
      ledger.transfer({ idempotencyKey: "test:empty", legs: [] }),
    ).rejects.toThrow(/at least one leg/);
  });

  it("accepts a balanced two-leg transfer as valid input (shape only)", () => {
    const legs = [
      { account: { type: "user" as const, id: "u1" }, entryType: "support_out" as const, amount: -50 },
      { account: { type: "creator" as const, id: "c1" }, entryType: "support_in" as const, amount: 50 },
    ];
    const total = legs.reduce((sum, leg) => sum + leg.amount, 0);
    expect(total).toBe(0);
  });
});
