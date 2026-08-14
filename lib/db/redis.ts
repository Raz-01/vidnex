import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set. Copy .env.example to .env.local and add your Upstash credentials.",
  );
}

export const redis = new Redis({ url, token });

/** Feed cache keys (see lib/feed) all live under this prefix. */
export const feedCacheKey = (scene: string) => `feed:${scene}:v1`;

/**
 * A conservative default rate limiter for write-ish API routes (earn
 * claims, spend actions, comments). Individual routes can construct their
 * own `Ratelimit` instance with a tighter window if needed.
 */
export const defaultRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  analytics: true,
  prefix: "ratelimit:default",
});
