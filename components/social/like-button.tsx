"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleLike } from "@/lib/social/actions";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  videoId: string;
  initialLiked: boolean;
  initialCount: number;
  isSignedIn: boolean;
}

export function LikeButton({ videoId, initialLiked, initialCount, isSignedIn }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  const base = "inline-flex flex-col items-center gap-1 text-sm";

  if (!isSignedIn) {
    return (
      <Link href="/login" className={cn(base, "text-ink-muted hover:text-ink")}>
        <HeartIcon filled={false} />
        {count}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      className={cn(base, liked ? "text-magenta" : "text-ink-muted hover:text-ink")}
      onClick={() => {
        const optimisticLiked = !liked;
        setLiked(optimisticLiked);
        setCount((c) => c + (optimisticLiked ? 1 : -1));
        startTransition(async () => {
          const result = await toggleLike(videoId);
          setLiked(result.liked);
        });
      }}
    >
      <HeartIcon filled={liked} />
      {count}
    </button>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.7 5c1.9 0 3.4 1 4.8 2.7C11.9 6 13.4 5 15.3 5c3.4 0 5.2 3.4 3.7 6.7C19.5 16.4 12 21 12 21Z" strokeLinejoin="round" />
    </svg>
  );
}
