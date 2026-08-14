"use client";

import { useState, useTransition } from "react";
import { toggleFollow } from "@/lib/social/actions";
import { Button, LinkButton } from "@/components/ui/button";

interface FollowButtonProps {
  creatorId: string;
  initialFollowing: boolean;
  isSignedIn: boolean;
  size?: "sm" | "md" | "lg";
}

export function FollowButton({ creatorId, initialFollowing, isSignedIn, size = "md" }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  if (!isSignedIn) {
    return (
      <LinkButton href="/login" variant="secondary" size={size}>
        Follow
      </LinkButton>
    );
  }

  return (
    <Button
      type="button"
      variant={following ? "secondary" : "primary"}
      size={size}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await toggleFollow(creatorId);
          setFollowing(result.following);
        });
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
