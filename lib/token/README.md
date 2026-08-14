# lib/token — the internal token ledger

Implements **DECISION 0** from `CLAUDE.md`: for the MVP the token is an internal
database ledger, not an on-chain asset. Everything here is written so a real
Rust/Anchor/Solana settlement layer (M5) can implement the same
`TokenLedger` interface later without touching call sites.

- `types.ts` — the `TokenLedger` interface and its data types. **Everything
  that touches tokens should depend on this interface**, not on
  `db-ledger.ts` or the schema directly.
- `db-ledger.ts` — the Postgres-backed implementation (`DbTokenLedger`),
  exported as a ready-to-use singleton `tokenLedger`. Provides the
  accounting primitives: balanced `transfer()`, `getBalance()`,
  `listEntries()`.

## What's here in M0 vs. what M3 builds

M0 ships the **primitives** (a generic, balanced, idempotent, auditable
transfer mechanism) so the schema and interface are settled early. M3 builds
the **policy** on top of these primitives:

- Capped/diminishing, human-gated **Earn** (`lib/token/earn.ts`, TBD in M3).
- The four spend utilities — **Support, Access, Boost, Membership**
  (`lib/token/spend.ts`, TBD in M3) — each of which is just one or more
  calls to `tokenLedger.transfer()` with the right `entryType`s and legs.
- Creator balance + dashboard reads (`tokenLedger.getBalance({ type:
  "creator", id })`).

## Example: a Support (tip) transfer

```ts
await tokenLedger.transfer({
  idempotencyKey: `support:${tipId}`, // unique per logical action
  legs: [
    { account: { type: "user", id: userId }, entryType: "support_out", amount: -50 },
    { account: { type: "creator", id: creatorId }, entryType: "support_in", amount: 50 },
  ],
});
```

Legs must sum to zero — a spend always lands somewhere (a creator, or the
discovery treasury for Boost's split). `transfer()` is safe to retry with
the same `idempotencyKey`.
