# CLAUDE.md - Master Build Brief

*This is the project brief for Claude Code. Read it fully before writing any code. This is a **seed-stage MVP**: its job is to demonstrate a compelling, working product to real creators and to investors. Build in milestones, deploy each one, and check in with the founder between milestones - do not one-shot the whole thing.*

> Working name: **vidnex**.

---

## HOW TO WORK

- Build milestones **M0 → M4 in order** (M5 is a deferred/parallel phase - do NOT start it without explicit go-ahead). Stop and summarize after each milestone.
- Each milestone must be **deployable and demoable** on its own - this is being shown to investors.
- **Design quality is a first-class requirement**, not a finishing touch. This is a culturally-driven entertainment product; a generic template-looking app will fail the demo. Prioritize a distinctive, premium, mobile-first aesthetic that feels native to African entertainment (energy, warmth, boldness) without being a stereotype. Use the frontend-design guidance available to you.
- Keep a running `DECISIONS.md` and a `README.md` with setup + how to run each milestone.
- The founder is a strong TypeScript/Next.js developer. Explain non-obvious choices briefly.

---

## DECISION 0 - Token runs as an internal ledger for the MVP (confirm before M3)

For this MVP, the token is an **internal database ledger**, not an on-chain asset. The full token *experience* is built (earn, spend, creator balances, the four utilities), but:
- **No mainnet, no real token issuance, no real-money creator cash-out** in the MVP. Cash-out is **simulated / manual and clearly labelled** as such.
- All token logic sits **behind a clean `TokenLedger` interface** so a real Rust/Anchor/Solana settlement layer can replace the ledger later **without a rewrite** (see M5).

Rationale: speed to a demoable product for the seed raise; avoiding Nigerian digital-asset securities/capital obligations (which attach the moment real tokens are issued/cashed out); and not making a first production smart contract the founder's Rust learning exercise. **The on-chain/Rust vision is deferred, not dropped.** If the founder overrides this, redesign M3/M5 accordingly.

---

## THE VISION (keep in mind)

A **digital home for African entertainment**, launching with ONE culturally concentrated scene (e.g. Afrobeats or Nigerian comedy). Short-form video is how people arrive; **creator-fan relationships** are why they stay; a **single in-app token** is how value moves. We do NOT ask anyone to leave TikTok/Instagram - creators link their home base from there and funnel their most engaged fans in.

---

## NON-NEGOTIABLE PRINCIPLES

1. **Free social is always free.** Watch, like, comment, follow, share - never cost a token, ever. The token enters only when a user wants *more* than ordinary participation.
2. **One token, one balance.** Users only see/earn/spend the token in-app. Fiat touches the system only at two (currently simulated) doors: buying tokens, and creator cash-out.
3. **Users cannot withdraw. Only creators can (simulated in MVP).** Users are spenders, never sellers. This is the backbone of the whole economic design - do not break it.
4. **Non-speculative by design.** No peg, no promise the token gains market value, no "earn early to get rich." The token's worth is what it *unlocks*, like arcade tokens.
5. **Premium, culturally-native design.** See "How to work."

---

## THE TOKEN MODEL (from TOKENOMICS v0.1 - implement as ledger)

**Earning (call it "Rewards / Earn", never "mining"):**
- Users receive a **small, capped, diminishing** allocation for genuine participation. 1st meaningful action earns; the 500th earns ~nothing. **Flat "watch N videos → N tokens" is banned** (bot bait).
- **Human-gated:** earning requires verified uniqueness (one human = one earner). Start conservative.

**The four spend utilities (build all four):**
| Utility | What it is | Token fate |
|---|---|---|
| **Support** | Tip / gift / super-support a creator | → creator balance |
| **Access** | Unlock exclusive content / drops | lock or burn |
| **Boost** | Spend to help surface a creator's video (bounded, diminishing-returns discovery - NOT "tokens = guaranteed reach", to avoid the Steemit vote-buying trap) | split: creator + discovery treasury |
| **Membership** | Recurring fan-club subscription (e.g. monthly) | lock (term) → creator |

**Anti-abuse:** the non-withdrawal rule already defuses most farming (farmed tokens can't become cash). Concentrate verification at the **creator side** (real, unique creators; redeemable value tied to genuine activity). Diminishing returns everywhere value is created.

**Ledger integrity:** integer token units; every earn/spend/transfer is an auditable row; idempotent operations; a `TokenLedger` interface abstracting all of it.

---

## TECH STACK

**MVP (build now):**
- **Frontend + app:** Next.js 15 (App Router) + TypeScript + Tailwind. Mobile-first **PWA**.
- **Backend:** Next.js server actions / route handlers (TypeScript). Keep the `TokenLedger` and any payments logic behind clean interfaces.
- **DB:** PostgreSQL + **Drizzle ORM** (Neon). **Redis** (Upstash) for feed cache + rate limiting.
- **Auth:** Auth.js - email + Google. No wallet auth in the MVP.
- **Video (critical):** **Mux** - browser-side direct upload, transcode, adaptive HLS, thumbnails, webhooks. **Never stream video through the backend.** Track cost-per-view.
- **Images/media:** Cloudflare R2.
- **Analytics:** PostHog + an internal `events` table (needed for investor metrics AND future recommendation).
- **Hosting:** Vercel + Neon + Upstash.
- **Testing:** Vitest for logic (ledger, earn caps, spend flows); Playwright for the key demo flows.

**Deferred (M5, post-seed - do NOT build now):** Rust + Anchor programs on **Solana** as the real token settlement layer, replacing the `TokenLedger` interface; real fiat doors via **Paystack/Flutterwave** (NGN) + **Stripe** (international); embedded wallets. Gated behind funding + legal structure.

---

## REPOSITORY & CONVENTIONS

```
/theapp
  /app            # Next.js (marketing, creator pages, feed, dashboard, admin, api)
  /components
  /lib
    /db           # drizzle schema + client
    /token        # TokenLedger interface + ledger implementation (swappable for on-chain later)
    /video        # Mux client wrapper
    /events       # analytics helpers
    /feed         # curated feed assembly
  /drizzle        # migrations
  CLAUDE.md  README.md  DECISIONS.md  TOKENOMICS.md  .env.example
```
Conventions: Zod for input validation; all token/money as integers; every token action auditable; feature-flag anything not demo-ready.

---

## MILESTONES

### M0 - Scaffold & design system
Next.js 15 + TS + Tailwind + PWA. Auth.js (email + Google). Drizzle + Neon; initial schema (`users`, `creators`, `videos`, `follows`, `likes`, `comments`, `token_ledger`, `memberships`, `events`). Upstash Redis. A real **design system** (type, color, components) that establishes the premium, culturally-native look. CI, `.env.example`, docs. Deploy skeleton.
**Acceptance:** builds, deploys, sign-up/in works, the design system looks distinctive - not a default template.

### M1 - Marketing site (the pitch surface)
The public landing site telling the story for two audiences (creators + fans), a **creator sign-up / waitlist**, and shareable structure. This is part of the raise - make it compelling.
**Acceptance:** a stranger understands the vision in 15 seconds; creators can register interest.

### M2 - Creator home pages + video + free social
Creator home pages (profile, links out to TikTok/IG/YouTube, videos, featured content) - shareable on web, the funnel destination and the relationship hub; make it excellent. Video upload/playback via Mux, vertical mobile-first player. Free social: like, comment, follow, share.
**Acceptance:** creator uploads; viewer watches, engages free; creator pages load fast on mid-range Android.

### M3 - The token economy (internal ledger) + creator dashboard
Confirm DECISION 0. Implement the `TokenLedger`, the capped/diminishing/human-gated **Earn**, and all four spend utilities (**Support, Access, Boost, Membership**). Creator balances + a **creator dashboard** (token earnings, supporters, membership list, simulated/labelled cash-out, video analytics).
**Acceptance:** a user earns tokens, spends them across all four utilities, creators accrue balances, and the whole loop is demoable end-to-end - the core differentiator, visibly working.

### M4 - Curated feed, admin, instrumentation
Curated single-scene feed (editorial/admin-ordered, cached in Redis - **no ML recommender**). Admin curation + moderation tools (first-class - at launch this IS the recommendation engine). Analytics instrumentation capturing the metrics investors will ask about: creators onboarded, engagement rates, token velocity, membership uptake, retention.
**Acceptance:** admin shapes the feed; a metrics view shows the numbers you'd put in a pitch deck.

### M5 - DEFERRED: on-chain settlement + real fiat (post-seed, do NOT start without go-ahead)
Replace `TokenLedger` with Rust/Anchor programs on Solana (devnet → mainnet), add real fiat doors and embedded wallets. **Gated behind funding AND a resolved legal structure** (see below).

---

## CROSS-CUTTING

- **Investor-demo bar:** every milestone should be something you'd be proud to screen-share. Polish and reliability over feature count.
- **Legal guardrails (surface, don't ignore):** under Nigeria's ISA 2025, virtual assets are securities and issuance is capital-gated. The MVP stays safe by keeping the token an internal ledger with **no real issuance or cash-out**. Do NOT add real token sale/cash-out until a Nigerian digital-assets lawyer has classified the structure. Leave clear TODOs where the design assumes something legally non-trivial.
- **Cost:** video (Mux) is the main variable cost - log an estimated cost-per-view; use adaptive quality.
- **Performance:** target mid-range Android on mobile data.

---

## NON-GOALS (do NOT build in the MVP)

- Mainnet, real token issuance, real-money creator cash-out, or user withdrawal (cash-out is simulated/labelled; user withdrawal never exists).
- Rust/Solana/on-chain anything (that's M5, deferred).
- A machine-learning recommendation engine (curation first).
- A native mobile app (web PWA first).
- Multiple scenes/cultures at once (one scene only).
- Charging tokens for basic social actions (likes/comments/follows/shares stay free forever).
- Finalized token supply/emissions numbers (those come from economic modelling, not code).

---

## HAND BACK AFTER EACH MILESTONE

What shipped, the deploy URL, decisions logged, any non-goal you were tempted by and avoided, and the single riskiest thing about the next milestone. Then wait for go-ahead.

---

*This MVP demonstrates the entire product and token economy as a fast, polished, legally-safe internal-ledger build - the version that raises the round. The Rust/Solana settlement layer and real money are deferred to M5, behind funding and legal structure, and the code is architected so they drop in without a rewrite. Build the story first.*
