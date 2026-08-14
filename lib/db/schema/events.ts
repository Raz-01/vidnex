import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Internal analytics log, alongside PostHog (lib/events). Kept in our own
 * DB so investor-facing metrics (creators onboarded, engagement, token
 * velocity, membership uptake, retention — see M4) are queryable without
 * depending on a third-party analytics export.
 */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousId: text("anonymous_id"), // for pre-auth / logged-out events
  name: text("name").notNull(),
  properties: jsonb("properties").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AppEvent = typeof events.$inferSelect;
export type NewAppEvent = typeof events.$inferInsert;
