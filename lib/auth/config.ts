import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";

/**
 * Auth.js v5 - email (magic link, via Resend) + Google. No wallet auth in
 * the MVP (see CLAUDE.md). Sessions are stored in Postgres via the Drizzle
 * adapter so we can join user identity against creators/token accounts
 * server-side without a separate session store.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google,
    Resend({
      from: process.env.AUTH_RESEND_FROM ?? "vidnex <onboarding@resend.dev>",
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    // Human-gating for Earn (see lib/token/earn.ts): both providers imply
    // a verified email by the time sign-in succeeds (Google always, Resend
    // via the magic-link click), so this is the conservative MVP proxy for
    // "one human = one earner" from TOKENOMICS.md. Idempotent - safe to
    // run on every sign-in, not just the first.
    async signIn({ user }) {
      if (user.id) {
        await db.update(users).set({ isVerifiedHuman: true }).where(eq(users.id, user.id));
      }
    },
  },
});
