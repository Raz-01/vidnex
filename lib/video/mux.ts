import { Mux } from "@mux/mux-node";

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;

if (!tokenId || !tokenSecret) {
  throw new Error(
    "MUX_TOKEN_ID / MUX_TOKEN_SECRET are not set. Copy .env.example to .env.local and add your Mux credentials.",
  );
}

/**
 * Mux client wrapper. Uploads happen browser-to-Mux directly (see
 * components/video/upload-video-form.tsx, which uses @mux/upchunk against
 * the URL returned by createDirectUpload) - video bytes never pass through
 * our backend, per CLAUDE.md. This module only ever talks to the Mux API
 * (creating uploads, verifying webhooks), never video data itself.
 */
export const muxClient = new Mux({ tokenId, tokenSecret });

/**
 * Starts a direct upload for a given video row. `passthrough` carries our
 * internal `videos.id` so the webhook handler can match the resulting
 * asset back to the right row without a second lookup table.
 */
export async function createDirectUpload(videoId: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return muxClient.video.uploads.create({
    cors_origin: appUrl,
    new_asset_settings: {
      playback_policy: ["public"],
      passthrough: videoId,
      max_resolution_tier: "1080p",
    },
  });
}

export function muxThumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&fit_mode=smartcrop`;
}
