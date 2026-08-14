import { PostHog } from "posthog-node";
import { db } from "@/lib/db/client";
import { events } from "@/lib/db/schema";

/**
 * Analytics instrumentation (M4): every event writes to our own `events`
 * table (queried directly by /admin/metrics - no third-party dependency
 * for the numbers that matter) and, best-effort, to PostHog if configured.
 *
 * Unlike every other client in lib/ (db, redis, mux), this one does NOT
 * throw when unconfigured - analytics must never be able to break a
 * user-facing action. `NEXT_PUBLIC_POSTHOG_KEY` is unset in this
 * deployment (placeholder credentials, like everything else), so the
 * PostHog side is currently a real no-op; the internal `events` table
 * still works fully since it just needs the DB, which is always
 * configured.
 */

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// flushAt: 1 / flushInterval: 0 - send immediately rather than batching,
// since a serverless function can terminate before a batched flush fires.
const posthogClient = posthogKey ? new PostHog(posthogKey, { host: posthogHost, flushAt: 1, flushInterval: 0 }) : null;

export type TrackEventName =
  | "creator_profile_created"
  | "video_upload_started"
  | "follow_created"
  | "like_created"
  | "comment_created"
  | "waitlist_joined"
  | "earn_claimed"
  | "support_sent"
  | "access_unlocked"
  | "boost_sent"
  | "membership_joined"
  | "membership_canceled";

interface TrackEventInput {
  name: TrackEventName;
  userId?: string;
  anonymousId?: string;
  properties?: Record<string, unknown>;
}

export async function trackEvent({ name, userId, anonymousId, properties = {} }: TrackEventInput) {
  try {
    await db.insert(events).values({
      userId: userId ?? null,
      anonymousId: anonymousId ?? null,
      name,
      properties,
    });
  } catch (err) {
    // Analytics must never break the action that triggered it.
    console.error(`trackEvent: failed to write "${name}" to events table`, err);
  }

  if (!posthogClient) return;
  try {
    posthogClient.capture({
      distinctId: userId ?? anonymousId ?? "anonymous",
      event: name,
      properties,
    });
  } catch (err) {
    console.error(`trackEvent: failed to send "${name}" to PostHog`, err);
  }
}
