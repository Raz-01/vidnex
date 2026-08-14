# Decisions

Running log of build decisions and why. Newest first.

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
later — not a side effect of `create-next-app` defaults.

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
explicitly never intercepts `/api/*` or cross-origin requests — important
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
CLAUDE.md calls for distinctive, premium, culturally-native — energy and
warmth without stereotype (i.e., not a literal flag palette). Dark-first
because this is a video-first product (like the apps it's meant to funnel
fans in from); gold is scoped to token UI only so it stays legible as "this
is currency" rather than becoming a generic accent color.

**CI builds with dummy env values, not real secrets.**
`next build` constructs the DB/Redis/Auth clients at import time (module
scope), which throws if env vars are unset — but construction never
performs a network call. CI sets clearly-fake placeholder values so the
build/typecheck/test pipeline runs without needing real Neon/Upstash/Auth
credentials in GitHub Actions. Real secrets live only in Vercel project
settings.
