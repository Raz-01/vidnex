# TOKENOMICS v0.1

The token model as implemented. This is the working reference for
engineering - final supply/emissions numbers come from economic
modelling, not this document (see Non-Goals in CLAUDE.md). Every numeric
constant below (`lib/token/policy.ts`) is a labelled placeholder chosen to
make the mechanics demoable, not a finalized economic parameter.

## Status: internal ledger (DECISION 0, confirmed for M3)

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

Implemented at `/rewards` (`lib/token/earn.ts`). A user claims manually
(no client JS, no auto-farming loop); each claim mints tokens from the
`void` account into their balance (`earn_emission` / `earn` legs).

- **Curve:** `amount(n) = round(baseAmount * decayPerClaim^n)`, where `n`
  is how many times this user has already claimed (0-indexed). Currently
  `baseAmount = 100`, `decayPerClaim = 0.985` - the first claim pays 100,
  it's under 50 by claim ~47, under 5 by claim ~200, and rounds to 0
  around claim ~350-400.
- **Hard cap:** claiming is refused outright at 500 lifetime claims
  (`EARN_POLICY.maxLifetimeClaims`) regardless of the curve - CLAUDE.md's
  "the 500th earns ~nothing," enforced structurally, not just by decay.
- **No wall-clock cooldown, deliberately.** A daily-limit design would
  make the mechanic nearly impossible to demo live (an investor can't
  wait 24 hours between clicks). The decay curve alone already bounds
  total value and makes rapid re-claiming visibly pointless - each click
  pays less than the last, converging to zero - which is arguably a
  *more* legible demo of "diminishing returns" than a hidden timer.
  Idempotency (`earn:{userId}:{claimCount}`) still prevents a double
  network-retry from double-granting the same claim.
- **Flat "watch N videos → N tokens" is explicitly banned** and not
  implemented - Earn is a manual claim, never tied to watch count.
- **Human-gated:** `users.isVerifiedHuman`, set on every successful sign-in
  (`lib/auth/config.ts`) since both providers (Google, Resend magic link)
  imply a verified email by the time sign-in succeeds. Conservative and
  weak against one person running multiple accounts - the honest MVP
  proxy for "one human = one earner," not a real uniqueness system.
  TODO(anti-abuse): revisit before any real earn-rate increase.

## The four spend utilities

All four are implemented as `lib/token/spend.ts` functions, each one or
more `tokenLedger.transfer()` calls with balanced legs - see the example
in `lib/token/README.md`.

| Utility | What it is | Token fate | Ledger `entryType`s |
|---|---|---|---|
| **Support** | Tip a creator, preset amounts (10/50/200) | → creator balance | `support_out` / `support_in` |
| **Access** | Unlock a creator-priced exclusive video | burn → `void` | `access_out` / `access_burn` |
| **Boost** | Preset spend (20/100/500) on a video's discovery | split 70/30: creator / discovery `treasury` | `boost_out` / `boost_creator_in` / `boost_treasury_in` |
| **Membership** | Recurring fan-club subscription, creator-set price, fixed 30-day term | → creator | `membership_out` / `membership_in` |

**Boost's discovery signal is sub-linear on purpose:** `videos.boostScore`
increases by `round(scoreScale * sqrt(amount))`, not by `amount` itself -
spending 25x more only doubles the bump. This is the mechanical guard
against "tokens = guaranteed reach" (the Steemit vote-buying trap CLAUDE.md
calls out). `boostScore` is not yet consumed by a ranking algorithm - the
curated feed (M4) is editorial/admin-ordered, not boost-driven.

**Access is a burn, not a transfer to the creator**, per CLAUDE.md's "lock
or burn" - the spent tokens leave circulation into the `void` account
rather than crediting anyone. A creator's own simulated cash-out (see
below) also credits `void`, for the same reason: both are "tokens leaving
the ledger," just from different accounts.

## A fourth account: `void`

The ledger has four account types, not three: `user`, `creator`,
`treasury` (Boost's discovery pool), and **`void`** - added in M3,
representing "outside the ledger entirely." Earn mints tokens by debiting
`void` and crediting a user; Access burns and simulated cash-outs do the
reverse. Every emission and removal is still a normal balanced transfer,
not a special unbalanced case - `void`'s own balance is a running "net
tokens minted" figure across the whole system.

## Anti-abuse

- The non-withdrawal rule already defuses most farming - farmed tokens
  can't become cash.
- Verification effort concentrates on the **creator side**: real, unique
  creators (`creators.isVerified`), manually approved for MVP (via the M1
  waitlist; the M2/M3 `/studio` self-serve flow is separate and unverified
  by default - see DECISIONS.md).
- Diminishing returns everywhere value is created (Earn's decay curve,
  Boost's sqrt discovery signal).
- **Known gap:** spend functions check-then-write balance in two steps,
  not one atomic operation - a narrow race under concurrent self-spending.
  Documented in `lib/token/README.md`, acceptable for an MVP demo.

## Ledger integrity

- Integer token units only, never floats (`amount: integer` throughout the
  schema).
- Every earn/spend/transfer is an auditable row in
  `token_ledger_entries`, grouped by `transferId`, with a caller-supplied
  `idempotencyKey` so retries never double-write.
- Balance reads (dashboard, `/rewards`, header pill) all call
  `tokenLedger.getBalance()` live against the ledger - `creators.tokenBalance`
  exists in the schema but is **not** populated as of M3; the ledger is
  the only source of truth right now, not a cache with a synced copy.

## What's built vs. pending

- **M0 (done):** schema, `TokenLedger` interface, `DbTokenLedger`
  primitives (`transfer`, `getBalance`, `listEntries`).
- **M3 (done):** Earn (caps, diminishing curve, human gating), all four
  spend utility flows and their UI (`/rewards`, `/watch/[id]`,
  `/[handle]`), creator dashboard (`/studio`: balance, recent
  activity, members, simulated cash-out), video analytics fields
  (`boostScore`, exclusive/price).
- **M4 (pending):** `boostScore` actually feeding the curated feed;
  admin tooling for creator verification and moderation; investor-facing
  aggregate metrics (token velocity, membership uptake, etc.).
