import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

/**
 * A user is anyone with an account. Being a "creator" is an additive role
 * (see `creators`), not a separate identity — every creator is also a user.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  name: text("name"),
  handle: text("handle").unique(), // public @handle, set during onboarding
  image: text("image"),

  // Human-gating for the Earn system (DECISION 0 / TOKENOMICS.md).
  // MVP: coarse, self-contained checks (verified email + light heuristics).
  // TODO(legal/anti-abuse): revisit before any real earn-rate increase.
  isVerifiedHuman: boolean("is_verified_human").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
