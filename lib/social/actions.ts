"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { comments, creators, follows, likes, videos } from "@/lib/db/schema";
import { trackEvent } from "@/lib/events/track";

/**
 * Free social - follow, like, comment, share. NON-NEGOTIABLE per CLAUDE.md:
 * none of these ever touch the token ledger. Follower/like/comment counts
 * on creators/videos are denormalized caches, kept in sync in the same
 * transaction as the underlying row (same pattern as lib/token).
 */

export async function toggleFollow(creatorId: string): Promise<{ following: boolean }> {
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const userId = session.user.id;

  const [existing] = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.creatorId, creatorId)))
    .limit(1);

  if (existing) {
    await db.transaction(async (tx) => {
      await tx
        .delete(follows)
        .where(and(eq(follows.followerId, userId), eq(follows.creatorId, creatorId)));
      await tx
        .update(creators)
        .set({ followerCount: sql`greatest(${creators.followerCount} - 1, 0)` })
        .where(eq(creators.id, creatorId));
    });
    return { following: false };
  }

  await db.transaction(async (tx) => {
    await tx.insert(follows).values({ followerId: userId, creatorId }).onConflictDoNothing();
    await tx
      .update(creators)
      .set({ followerCount: sql`${creators.followerCount} + 1` })
      .where(eq(creators.id, creatorId));
  });
  await trackEvent({ name: "follow_created", userId, properties: { creatorId } });
  return { following: true };
}

export async function toggleLike(videoId: string): Promise<{ liked: boolean }> {
  const session = await auth();
  if (!session?.user) throw new Error("unauthorized");
  const userId = session.user.id;

  const [existing] = await db
    .select({ userId: likes.userId })
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)))
    .limit(1);

  if (existing) {
    await db.transaction(async (tx) => {
      await tx.delete(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)));
      await tx
        .update(videos)
        .set({ likeCount: sql`greatest(${videos.likeCount} - 1, 0)` })
        .where(eq(videos.id, videoId));
    });
    return { liked: false };
  }

  await db.transaction(async (tx) => {
    await tx.insert(likes).values({ userId, videoId }).onConflictDoNothing();
    await tx
      .update(videos)
      .set({ likeCount: sql`${videos.likeCount} + 1` })
      .where(eq(videos.id, videoId));
  });
  await trackEvent({ name: "like_created", userId, properties: { videoId } });
  return { liked: true };
}

const commentSchema = z.object({ body: z.string().trim().min(1).max(1000) });

export async function addComment(videoId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = commentSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return;

  await db.transaction(async (tx) => {
    await tx.insert(comments).values({ userId: session.user.id, videoId, body: parsed.data.body });
    await tx
      .update(videos)
      .set({ commentCount: sql`${videos.commentCount} + 1` })
      .where(eq(videos.id, videoId));
  });
  await trackEvent({ name: "comment_created", userId: session.user.id, properties: { videoId } });

  revalidatePath(`/watch/${videoId}`);
}
