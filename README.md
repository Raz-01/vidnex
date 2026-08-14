# vidnex

The digital home for African entertainment — short-form video, real creator
relationships, and one in-app token. See [CLAUDE.md](./CLAUDE.md) for the
full product brief, [DECISIONS.md](./DECISIONS.md) for build decisions, and
[TOKENOMICS.md](./TOKENOMICS.md) for the token model.

This repo is built in milestones (**M0 → M4**), each deployable and
demoable on its own. Current status: **M0 — Scaffold & design system**.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Drizzle ORM + Neon
(Postgres) · Upstash Redis · Auth.js v5 (Google + email) · Mux (video, from
M2) · Cloudflare R2 (media, from M2) · PostHog (analytics).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
npm run db:push              # push the schema to your Neon database
npm run dev                  # http://localhost:3000
```

### Services you need for M0

| Service | Why | Get it |
|---|---|---|
| Neon (Postgres) | Primary database | [neon.tech](https://neon.tech) — copy the pooled connection string into `DATABASE_URL` |
| Upstash (Redis) | Feed cache + rate limiting | [upstash.com](https://upstash.com) — REST URL + token |
| Google OAuth | Sign-in provider | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — redirect URI `{APP_URL}/api/auth/callback/google` |
| Resend | Magic-link email sign-in | [resend.com](https://resend.com) — API key |

Generate `AUTH_SECRET` with `npx auth secret`.

Everything else in `.env.example` (Mux, R2, PostHog) is wired for later
milestones — safe to leave blank until then; those code paths aren't
exercised yet.

## Scripts

```bash
npm run dev          # local dev server
npm run build         # production build
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm run test           # vitest (ledger + logic tests)
npm run icons          # regenerate PWA/favicon PNGs from the logo mark
npm run db:generate    # generate a new Drizzle migration from schema changes
npm run db:push        # push schema directly (fast iteration, pre-launch)
npm run db:studio      # Drizzle Studio — browse the database
```

## Project layout

```
/app            # Next.js routes (marketing, auth, and — soon — creator/feed/dashboard/admin)
/components/ui  # Design system primitives (Button, Card, Badge, Logo, ...)
/lib
  /db           # Drizzle schema + Neon/Redis clients
  /token        # TokenLedger interface + implementation (DECISION 0 — swappable for on-chain later)
  /auth         # Auth.js v5 config
/drizzle        # Generated SQL migrations
/scripts        # One-off build scripts (icon generation)
```

## Deploying

This is a standard Next.js app — deploy to [Vercel](https://vercel.com),
connect the repo, and set the env vars from `.env.example` in the project
settings. Neon and Upstash both have first-party Vercel integrations that
can wire the connection strings for you automatically.

## Design system

Dark-first, mobile-first. A signature "flame" gradient (coral → magenta →
violet) marks brand moments (logo, primary CTAs); a reserved gold accent is
used *only* for token/currency UI so it stays meaningful. Display type is
Bricolage Grotesque, body is Inter. See `app/globals.css` for tokens and
`components/ui/` for primitives.

## Milestone status

- [x] **M0** — Scaffold, design system, auth, schema, PWA shell.
- [ ] **M1** — Marketing site.
- [ ] **M2** — Creator pages, video (Mux), free social.
- [ ] **M3** — Token economy (internal ledger) + creator dashboard.
- [ ] **M4** — Curated feed, admin, instrumentation.
- [ ] **M5** — *Deferred.* On-chain settlement (Solana) + real fiat. Not started.
