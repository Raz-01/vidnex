# lib/token - the internal token ledger

Implements **DECISION 0** from `CLAUDE.md`: for the MVP the token is an internal
database ledger, not an on-chain asset. Everything here is written so a real
Rust/Anchor/Solana settlement layer (M5) can implement the same
`TokenLedger` interface later without touching call sites.

- `types.ts` - the `TokenLedger` interface and its data types. **Everything
  that touches tokens should depend on this interface**, not on
  `db-ledger.ts` or the schema directly.
- `db-ledger.ts` - the Postgres-backed implementation (`DbTokenLedger`),
  exported as a ready-to-use singleton `tokenLedger`. Provides the
  accounting primitives: balanced `transfer()`, `getBalance()`,
  `listEntries()`.
- `policy.ts` - the provisional MVP constants (earn curve, boost split,
  presets). **Not final tokenomics** - see the header comment there.
- `earn.ts` - the capped/diminishing, human-gated Earn claim.
- `spend.ts` - the four spend utilities: Support, Access, Boost, Membership
  (plus a creator's simulated cash-out). Each is one or more calls to
  `tokenLedger.transfer()` with the right `entryType`s and legs.
- `actions.ts` - `"use server"` wrappers around `earn.ts`/`spend.ts` for use
  directly from pages/components (auth, validation, redirects).

## Four accounts, not three

Every ledger entry belongs to a `user`, a `creator`, the `treasury`
(Boost's non-creator split), or `void` - a fourth, singleton account added
in M3 representing "outside the ledger entirely." Earn mints tokens by
debiting `void` and crediting the user; a burn (Access) or a simulated
cash-out does the reverse, crediting `void`. This keeps every emission and
every removal auditable as a normal balanced transfer instead of a special
unbalanced case - `void`'s own balance is a running "net tokens minted"
figure, which is a useful sanity check on its own.

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

Legs must sum to zero - a spend always lands somewhere (a creator, the
discovery treasury for Boost's split, or `void` for a burn/cash-out).
`transfer()` is safe to retry with the same `idempotencyKey`.

## Known limitation: no transactional balance check

`spend.ts` reads a balance, checks it's sufficient, then writes the
transfer as a separate step - there's a narrow race where two concurrent
spends from the same account could both pass the check before either
writes, landing the balance negative. Acceptable for an MVP demo (single
user, not concurrently self-spending); worth closing with a DB-level
constraint or a serializable transaction before this handles real money.
