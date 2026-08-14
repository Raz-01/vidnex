import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { videos } from "@/lib/db/schema";
import { muxClient, muxThumbnailUrl } from "@/lib/video/mux";

const webhookSecret = process.env.MUX_WEBHOOK_SECRET;

/**
 * Mux webhook receiver. Must read the raw body (not request.json()) since
 * signature verification hashes the exact bytes Mux sent.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!webhookSecret) {
    console.error("MUX_WEBHOOK_SECRET is not set - rejecting webhook.");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  let event;
  try {
    event = await muxClient.webhooks.unwrap(rawBody, request.headers, webhookSecret);
  } catch (err) {
    console.error("Mux webhook signature verification failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "video.asset.created": {
      // Upload finished, Mux is now transcoding.
      const videoId = event.data.passthrough;
      if (!videoId) break;

      await db
        .update(videos)
        .set({ muxAssetId: event.data.id, status: "processing", updatedAt: new Date() })
        .where(eq(videos.id, videoId));
      break;
    }

    case "video.asset.ready": {
      const asset = event.data;
      const videoId = asset.passthrough;
      const playbackId = asset.playback_ids?.[0]?.id;
      if (!videoId) break;

      await db
        .update(videos)
        .set({
          muxAssetId: asset.id,
          muxPlaybackId: playbackId ?? null,
          durationSeconds: asset.duration ? Math.round(asset.duration) : null,
          thumbnailUrl: playbackId ? muxThumbnailUrl(playbackId) : null,
          status: "ready",
          updatedAt: new Date(),
        })
        .where(eq(videos.id, videoId));
      break;
    }

    case "video.asset.errored": {
      const asset = event.data;
      const videoId = asset.passthrough;
      if (!videoId) break;

      await db
        .update(videos)
        .set({ status: "errored", updatedAt: new Date() })
        .where(eq(videos.id, videoId));
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
