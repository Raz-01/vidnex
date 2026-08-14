"use client";

import MuxPlayer from "@mux/mux-player-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  playbackId: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  className?: string;
  autoPlay?: boolean;
}

/** Vertical, mobile-first player - short-form video is 9:16, never letterboxed. */
export function VideoPlayer({ playbackId, title, thumbnailUrl, className, autoPlay }: VideoPlayerProps) {
  return (
    <MuxPlayer
      playbackId={playbackId}
      streamType="on-demand"
      metadata={{ video_title: title ?? undefined }}
      poster={thumbnailUrl ?? undefined}
      autoPlay={autoPlay}
      loop
      playsInline
      accentColor="#ff3d77"
      className={cn("w-full h-full rounded-2xl overflow-hidden bg-canvas-overlay", className)}
      style={{ aspectRatio: "9 / 16" }}
    />
  );
}
