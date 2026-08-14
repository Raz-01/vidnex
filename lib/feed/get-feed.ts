import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { creators, users, videos } from "@/lib/db/schema";
import { redis, feedCacheKey } from "@/lib/db/redis";

/**
 * The M4 curated feed: editorial/admin-ordered, cached in Redis, no ML
 * recommender (CLAUDE.md is explicit about this). Featured videos
 * (`videos.featuredRank` set by an admin in /admin/feed) come first in
 * rank order; everything else falls back to newest-first so the feed is
 * never empty just because nothing's been curated yet.
 */

export interface FeedItem {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  featuredRank: number | null;
  createdAt: string;
  creatorDisplayName: string;
  creatorHandle: string | null;
}

const FEED_CACHE_TTL_SECONDS = 60;
const FEED_LIMIT = 60;

async function queryFeed(scene: string): Promise<FeedItem[]> {
  const rows = await db
    .select({
      id: videos.id,
      title: videos.title,
      thumbnailUrl: videos.thumbnailUrl,
      featuredRank: videos.featuredRank,
      createdAt: videos.createdAt,
      creatorDisplayName: creators.displayName,
      creatorHandle: users.handle,
    })
    .from(videos)
    .innerJoin(creators, eq(videos.creatorId, creators.id))
    .innerJoin(users, eq(creators.userId, users.id))
    .where(and(eq(videos.status, "ready"), eq(videos.isRemoved, false), eq(creators.scene, scene)))
    .orderBy(sql`${videos.featuredRank} is null`, asc(videos.featuredRank), desc(videos.createdAt))
    .limit(FEED_LIMIT);

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export async function getFeed(scene: string): Promise<FeedItem[]> {
  const key = feedCacheKey(scene);

  try {
    const cached = await redis.get<FeedItem[]>(key);
    if (cached) return cached;
  } catch {
    // Redis unavailable - fall through to a live query rather than error the page.
  }

  const feed = await queryFeed(scene);

  try {
    await redis.set(key, feed, { ex: FEED_CACHE_TTL_SECONDS });
  } catch {
    // Best-effort cache; a failed write just means the next request re-queries.
  }

  return feed;
}

/** Called by admin curation actions so a rank change shows up immediately, not after the TTL. */
export async function invalidateFeedCache(scene: string) {
  try {
    await redis.del(feedCacheKey(scene));
  } catch {
    // Best-effort - worst case the stale entry expires on its own in FEED_CACHE_TTL_SECONDS.
  }
}
