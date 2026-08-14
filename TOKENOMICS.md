# TOKENOMICS v0.1

The token model as implemented (or, where noted, to be implemented in M3).
This is the working reference for engineering - final supply/emissions
numbers come from economic modelling, not this document (see Non-Goals in
CLAUDE.md).

## Status: internal ledger (DECISION 0)

For the MVP, the token is a database ledger (`lib/token`), not an on-chain
asset. No mainnet, no real issuance, no real-money user withdrawal, ever.
Creator cash-out is simulated/manual and clearly labelled as such. This is
architected so a real settlement layer (Rust/Anchor/Solana, M5) can
implement the same `TokenLedger` interface later without a rewrite - see
`lib/token/README.md`.

## Non-negotiable principles

1. **Free social is always free.** Watch, like, comment, follow, share - never cost a token.
2. **One token, one balance.** Users only see/earn/spend the token
   in-app.
3. **Users cannot withdraw. Only creators can (simulated in MVP).** Users
   are spenders, never sellers.
4. **Non-speculative by design.** No peg, no promise of market value.
5. **Diminishing returns everywhere value is created.**

## Earning ("Rewards / Earn" - never "mining")

- Small, capped, diminishing allocation for genuine participation. First
  meaningful action earns; the 500th earns ~nothing.
- Flat "watch N videos → N tokens" is explicitly banned (bot bait).
- Human-gated: one human = one earner. Start conservative - see
  `users.isVerifiedHuman` in the schema and `lib/token/README.md` for
  where the M3 earn policy plugs in.

## The four spend utilities

| Utility | What it is | Token fate | Ledger `entryType`s |
|---|---|---|---|
| **Support** | Tip / gift a creator | → creator balance | `support_out` / `support_in` |
| **Access** | Unlock exclusive content/drops | lock or burn | `access_out` / `access_burn` |
| **Boost** | Bounded, diminishing-returns discovery spend - never "tokens = guaranteed reach" (avoids the Steemit vote-buying trap) | split: creator + discovery treasury | `boost_out` / `boost_creator_in` / `boost_treasury_in` |
| **Membership** | Recurring fan-club subscription | lock (term) → creator | `membership_out` / `membership_in` |

All four are implemented as `tokenLedger.transfer()` calls with balanced
legs - see the example in `lib/token/README.md`.

## Anti-abuse

- The non-withdrawal rule already defuses most farming - farmed tokens
  can't become cash.
- Verification effort concentrates on the **creator side**: real, unique
  creators (`creators.isVerified`), manually approved for MVP.
- Diminishing returns everywhere value is created (Earn, Boost).

## Ledger integrity

- Integer token units only, never floats (`amount: integer` throughout the
  schema).
- Every earn/spend/transfer is an auditable row in
  `token_ledger_entries`, grouped by `transferId`, with a caller-supplied
  `idempotencyKey` so retries never double-write.
- Any balance shown in the UI (e.g. `creators.tokenBalance`) is a cache - the ledger table is the single source of truth.

## What's built vs. pending

- **M0 (done):** schema, `TokenLedger` interface, `DbTokenLedger`
  primitives (`transfer`, `getBalance`, `listEntries`).
- **M3 (pending):** the Earn policy (caps, diminishing curve, human
  gating), the four spend utility flows and their UI, creator balances +
  dashboard, simulated cash-out.
