# Decisions

Running log of build decisions and why. Newest first.

## M2

**Creator profiles are self-serve (`/studio`), separate from the M1
waitlist.** The waitlist is the real-launch recruitment funnel (human
review before onboarding, per TOKENOMICS.md). But M2's job is to prove
the upload-and-watch loop end to end, and that needs actual `creators`
rows to attach videos to. Any signed-in user can create one; `isVerified`
stays false until an admin flips it (M4). Two separate concerns, one
schema.

**Video permalinks are `/watch/[videoId]`, not nested under
`/[handle]/v/[videoId]`.** A flat route is simpler to link, share, and
revalidate from server actions (no need to carry the creator's handle
through the like/comment/follow call chain just to redirect or
revalidate). The creator page still links into it from the video grid.

**Mux upload flow: pending `videos` row created first, then the Mux
direct upload, `passthrough` set to that row's id.** The webhook handler
matches the resulting asset back to our row via `passthrough` alone - no
second lookup table keyed on `upload_id` needed. `video.asset.created`
moves status to `processing`, `video.asset.ready` to `ready` (with
`playback_id`/`duration`/`thumbnail`), `video.asset.errored` to
`errored` - all three write paths share the same `passthrough`-based
match.

**Webhook route reads the raw body via `request.text()`, not
`request.json()`.** Mux's signature verification (`mux.webhooks.unwrap`)
hashes the exact bytes sent; parsing first would still work for the
comparison as long as we didn't touch the string, but reading raw text is
the documented-safe pattern and avoids any risk of a body transform
changing byte content before verification.

**Follow/like are called directly as server actions from client
components (not `<form action>`), with local `useTransition` state for
immediate feedback.** These need instant toggle feedback (heart fills,
follow button flips) that a full-page-reload form submission wouldn't
give without extra client wiring anyway; Next 15 supports importing a
`"use server"` function straight into a Client Component, so this needed
no API route. Comments use a plain form instead - no toggle, so
progressive enhancement is enough, matching the M0/M1 form pattern.

**No image upload for creator avatars/banners in M2 (paste-a-URL only via
social links; avatar itself is a generated initial-letter circle).**
Cloudflare R2 (the brief's media store) has no credentials yet, and
building real image upload for a value that's cosmetic right now would
be scope the milestone doesn't need. `creators.avatarUrl`/`bannerUrl`
columns already exist in the schema for when R2 is wired up.

**Known limitation on the current placeholder-credential deploy:**
`/[handle]` and `/watch/[id]` read the DB unconditionally on every
request (there's no session cookie to skip the query the way `/login` and
`/studio`'s redirect-if-signed-out check can). Against the placeholder
`DATABASE_URL` (a host that doesn't resolve), that read throws a
connection error rather than returning zero rows, so an unknown
handle/video 500s instead of 404ing. Not a code bug - confirmed by the
fact that non-DB-touching routes (`/login`, `/creators` GET) are
unaffected - and it resolves itself once a real Neon connection is in
place.

## M1

**Creators go through a waitlist (`creator_waitlist` table), not
self-serve signup.** Fans can already sign in via M0's Auth.js flow with
no gate. Creators can't yet - creator tooling (profile pages, dashboard)
doesn't exist until M2/M3, and TOKENOMICS.md concentrates anti-abuse
verification on the creator side ("real, unique creators, manually
approved for MVP"). A waitlist is the right shape for "manually approved":
a human-reviewed queue, not a table that grants a role on insert.

**Waitlist form is a plain progressive-enhancement server action
(`app/creators/page.tsx` + `lib/waitlist/actions.ts`), not a client
component with `useActionState`.** Matches the pattern already established
by the M0 login forms - no client JS required for the core flow, errors
round-trip via a redirect + `?error=` query param read in the server
component. Simpler than introducing client-side form state for one
milestone's one form.

**Waitlist submission is idempotent on email, silently.** Re-submitting an
already-registered email redirects to the same "you're on the list"
confirmation rather than surfacing a "you've already applied" error -
nothing sensitive is at stake either way, and it avoids a confusing dead
end for a well-intentioned retry (e.g. someone unsure if their first
submit went through).

**Share images are generated from code (`app/opengraph-image.tsx` via
`next/og`), not a static PNG asset.** Keeps the OG image in sync with the
same flame-gradient mark used everywhere else (`components/ui/logo.tsx`)
without a second asset to keep updated by hand - same reasoning as the
`sharp` icon-generation script in M0.

**Generated and committed the initial Drizzle migration
(`drizzle/0000_heavy_meggan.sql`) even without a live database to run it
against yet.** `drizzle-kit generate` only diffs the TypeScript schema
against migration snapshots - it doesn't need real DB connectivity - so
there's no reason to leave `/drizzle` empty until real Neon credentials
show up. `npm run db:migrate` (or `db:push` for fast pre-launch iteration)
applies it once a real `DATABASE_URL` is set.

**Deployed M0 to Vercel on placeholder service credentials, not held back
waiting for real ones.**
Real Neon/Upstash/Google OAuth/Resend accounts weren't available yet. Since
`next build` needs *some* value for `DATABASE_URL` etc. (client construction
happens at module scope - see the CI decision below), placeholder values
were set as real Vercel env vars (Production/Preview/Development) so the
milestone is actually live and demoable per CLAUDE.md's "each milestone
must be deployable" requirement, rather than sitting unshipped. Auth
sign-in and any DB write will error until real credentials replace the
placeholders (swap instructions in README). Public repo:
[github.com/Raz-01/vidnex](https://github.com/Raz-01/vidnex). Live:
[vidnex-chi.vercel.app](https://vidnex-chi.vercel.app).

## M0

**Package/repo name is `vidnex`, not the `theapp` placeholder.**
CLAUDE.md says use `theapp` until a name is chosen; the founder confirmed
the name is vidnex, so it's used everywhere (package.json, metadata,
manifest) rather than treating it as a placeholder to swap later.

**Next.js pinned to 15.5.x, React pinned to 18.3.x.**
`create-next-app@latest` pulled Next 16 / React 19, but CLAUDE.md
explicitly specifies Next.js 15, and the wider stack (`next-auth` v5 beta,
`@auth/drizzle-adapter`) is best-tested against Next 15 + React 18.
Downgraded immediately after scaffolding rather than fighting compatibility
issues mid-build. Revisit the jump to 16/19 as a deliberate, tested upgrade
later - not a side effect of `create-next-app` defaults.

**Neon driver: `neon-http` (fetch-based), not `neon-serverless` (websocket).**
`neon-http` needs no persistent connection, which fits Vercel's
serverless/edge functions better and is simpler to reason about. It
supports `db.transaction()` for the ledger's balanced-write requirement.
Revisit only if a call site needs true multi-statement interactive
transactions `neon-http` can't express.

**Auth.js v5 (beta) over v4.**
v4 doesn't target Next 15 App Router as cleanly; v5's server-action-based
`signIn`/`signOut` (no client JS needed for the basic flow) is a better fit
for the login/account pages. Session strategy is `database` (via the
Drizzle adapter) so we can join user identity server-side against
creators/token accounts without a separate session store.

**Email sign-in via Auth.js's built-in Resend provider, not raw SMTP.**
CLAUDE.md just says "email"; Resend is the lowest-setup option (a fetch
call in the provider, no separate SDK dependency) and pairs naturally with
the rest of the Vercel-adjacent stack. Swappable later.

**Token ledger idempotency: one caller-supplied key per transfer, one
derived key per leg (`{key}:{legIndex}`).**
The `token_ledger_entries` table has a unique index on `idempotencyKey`
per *row*, but a transfer is a set of balanced rows (e.g. a tip debits the
sender and credits the creator). Deriving per-leg keys from one logical
key keeps the caller's API simple (`transfer({ idempotencyKey, legs })`)
while satisfying the per-row uniqueness constraint, and lets a replay be
detected by checking for the first leg's derived key.

**Manual PWA (hand-rolled manifest + service worker), not `next-pwa`.**
For an MVP demo, installability + a thin app-shell cache is all that's
needed; a hand-rolled ~30-line service worker (`public/sw.js`) is easier to
reason about than debugging a plugin's App Router compatibility, and it
explicitly never intercepts `/api/*` or cross-origin requests - important
once Mux/HLS traffic shows up in M2.

**Icons generated from one SVG source via a `sharp` script
(`scripts/generate-icons.mjs`), not committed as static binaries someone
hand-exported.**
Keeps the logo mark defined once (`components/ui/logo.tsx` mirrors the same
path data) and regenerable (`npm run icons`) if the mark changes, instead
of stale PNGs drifting from the source of truth.

**Design system: dark-first canvas, a signature "flame" gradient (coral →
magenta → violet) for brand moments, gold reserved exclusively for
token/currency UI.**
CLAUDE.md calls for distinctive, premium, culturally-native - energy and
warmth without stereotype (i.e., not a literal flag palette). Dark-first
because this is a video-first product (like the apps it's meant to funnel
fans in from); gold is scoped to token UI only so it stays legible as "this
is currency" rather than becoming a generic accent color.

**CI builds with dummy env values, not real secrets.**
`next build` constructs the DB/Redis/Auth clients at import time (module
scope), which throws if env vars are unset - but construction never
performs a network call. CI sets clearly-fake placeholder values so the
build/typecheck/test pipeline runs without needing real Neon/Upstash/Auth
credentials in GitHub Actions. Real secrets live only in Vercel project
settings.
