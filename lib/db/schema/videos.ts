import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { creators } from "./creators";

export const videoStatusEnum = pgEnum("video_status", [
  "pending", // created, waiting on Mux upload
  "processing", // Mux is transcoding
  "ready", // playable
  "errored",
]);

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => creators.id, { onDelete: "cascade" }),

  title: text("title"),
  description: text("description"),

  // Mux (see lib/video) — never proxy video bytes through our backend.
  muxUploadId: text("mux_upload_id"),
  muxAssetId: text("mux_asset_id"),
  muxPlaybackId: text("mux_playback_id"),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: integer("duration_seconds"),
  status: videoStatusEnum("status").notNull().default("pending"),

  // Denormalized counters (see creators.tokenBalance note — same pattern).
  viewCount: integer("view_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),

  // Used by the M4 curated feed for editorial ordering; null = unfeatured.
  featuredRank: integer("featured_rank"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
