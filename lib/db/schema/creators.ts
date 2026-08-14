import { pgTable, text, timestamp, uuid, boolean, jsonb, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

/** Outbound links to a creator's home base elsewhere (TikTok, IG, YouTube, ...). */
export type CreatorLinks = Partial<{
  tiktok: string;
  instagram: string;
  youtube: string;
  x: string;
  website: string;
}>;

export const creators = pgTable("creators", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  links: jsonb("links").$type<CreatorLinks>().notNull().default({}),

  // MVP launches with a single culturally-concentrated scene; this column
  // exists so the schema doesn't need to change when a second scene ships.
  scene: text("scene").notNull().default("afrobeats"),

  // Creator-side verification is where anti-abuse effort concentrates
  // (see TOKENOMICS.md) - real, unique creators, manually approved for MVP.
  isVerified: boolean("is_verified").notNull().default(false),

  // Denormalized counters, updated by application logic (kept in sync via
  // the same transaction as the underlying like/follow event).
  followerCount: integer("follower_count").notNull().default(0),
  // NOT populated as of M3 - token balance reads go straight through
  // tokenLedger.getBalance({ type: "creator", id }) (the ledger IS the
  // source of truth). Wire this as a synced cache only if dashboard read
  // latency ever actually needs it.
  tokenBalance: integer("token_balance").notNull().default(0),

  // Membership (M3): null = this creator doesn't offer one. Recurring
  // period length is fixed MVP-wide (see lib/token/policy.ts).
  membershipPriceTokens: integer("membership_price_tokens"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Creator = typeof creators.$inferSelect;
export type NewCreator = typeof creators.$inferInsert;
