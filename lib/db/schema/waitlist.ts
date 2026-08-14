import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "pending", // registered interest, not yet reviewed
  "invited", // manually approved, onboarding link sent
  "onboarded", // has a creators row
]);

/**
 * Creator interest registration (M1). Not the same as `users` — most
 * entries here never sign in; this is the top of the creator funnel
 * before manual review (see TOKENOMICS.md — creator-side verification is
 * where anti-abuse effort concentrates, so this is a human-reviewed queue,
 * not a self-serve signup).
 */
export const creatorWaitlist = pgTable("creator_waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // Their existing home base — TikTok/IG/YouTube/etc — the same "link out"
  // concept as creators.links, just collected pre-approval.
  primaryLink: text("primary_link").notNull(),
  note: text("note"),
  status: waitlistStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CreatorWaitlistEntry = typeof creatorWaitlist.$inferSelect;
export type NewCreatorWaitlistEntry = typeof creatorWaitlist.$inferInsert;
