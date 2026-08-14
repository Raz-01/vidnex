import { pgTable, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { creators } from "./creators";

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "canceled", // will not renew, still active until periodEnd
  "expired",
]);

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),

  status: membershipStatusEnum("status").notNull().default("active"),
  tokensPerPeriod: integer("tokens_per_period").notNull(),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull().defaultNow(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
});

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;
