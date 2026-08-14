import { pgTable, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";
import { videos } from "./videos";

/**
 * Records that a user has paid to unlock a video's Access gate (see
 * lib/token/spend.ts#unlockAccess), so the paywall doesn't re-charge them
 * and the UI can show "unlocked" instead of a price.
 */
export const accessUnlocks = pgTable(
  "access_unlocks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] })],
);

export type AccessUnlock = typeof accessUnlocks.$inferSelect;
