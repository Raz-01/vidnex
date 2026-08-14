"use server";

import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, gt, isNotNull, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { comments, creatorWaitlist, creators, videos, waitlistStatusEnum } from "@/lib/db/schema";
import { requireAdmin } from "./require-admin";
import { invalidateFeedCache } from "@/lib/feed/get-feed";

const DEFAULT_SCENE = "afrobeats";

export async function featureVideo(formData: FormData) {
  await requireAdmin();
  const videoId = String(formData.get("videoId"));

  const [{ maxRank }] = await db
    .select({ maxRank: sql<number>`coalesce(max(${videos.featuredRank}), 0)` })
    .from(videos)
    .where(isNotNull(videos.featuredRank));

  await db
    .update(videos)
    .set({ featuredRank: Number(maxRank) + 1, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  await invalidateFeedCache(DEFAULT_SCENE);
  revalidatePath("/admin/feed");
  revalidatePath("/feed");
}

export async function unfeatureVideo(formData: FormData) {
  await requireAdmin();
  const videoId = String(formData.get("videoId"));

  await db.update(videos).set({ featuredRank: null, updatedAt: new Date() }).where(eq(videos.id, videoId));

  await invalidateFeedCache(DEFAULT_SCENE);
  revalidatePath("/admin/feed");
  revalidatePath("/feed");
}

const moveSchema = z.object({ videoId: z.string().uuid(), direction: z.enum(["up", "down"]) });

export async function moveVideoRank(formData: FormData) {
  await requireAdmin();
  const parsed = moveSchema.safeParse({
    videoId: formData.get("videoId"),
    direction: formData.get("direction"),
  });
  if (!parsed.success) return;
  const { videoId, direction } = parsed.data;

  const [current] = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!current || current.featuredRank == null) return;

  const neighborWhere =
    direction === "up"
      ? and(isNotNull(videos.featuredRank), lt(videos.featuredRank, current.featuredRank))
      : and(isNotNull(videos.featuredRank), gt(videos.featuredRank, current.featuredRank));
  const neighborOrder = direction === "up" ? desc(videos.featuredRank) : asc(videos.featuredRank);

  const [neighbor] = await db.select().from(videos).where(neighborWhere).orderBy(neighborOrder).limit(1);
  if (!neighbor) return; // already at the edge of the ranked list

  await db.transaction(async (tx) => {
    await tx.update(videos).set({ featuredRank: neighbor.featuredRank }).where(eq(videos.id, current.id));
    await tx.update(videos).set({ featuredRank: current.featuredRank }).where(eq(videos.id, neighbor.id));
  });

  await invalidateFeedCache(DEFAULT_SCENE);
  revalidatePath("/admin/feed");
  revalidatePath("/feed");
}

export async function toggleVideoRemoved(formData: FormData) {
  await requireAdmin();
  const videoId = String(formData.get("videoId"));

  const [video] = await db.select({ isRemoved: videos.isRemoved }).from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!video) return;

  await db.update(videos).set({ isRemoved: !video.isRemoved, updatedAt: new Date() }).where(eq(videos.id, videoId));

  await invalidateFeedCache(DEFAULT_SCENE);
  revalidatePath("/admin/moderation");
  revalidatePath(`/watch/${videoId}`);
}

export async function toggleCommentRemoved(formData: FormData) {
  await requireAdmin();
  const commentId = String(formData.get("commentId"));

  const [comment] = await db
    .select({ isRemoved: comments.isRemoved, videoId: comments.videoId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!comment) return;

  await db.update(comments).set({ isRemoved: !comment.isRemoved }).where(eq(comments.id, commentId));

  revalidatePath("/admin/moderation");
  revalidatePath(`/watch/${comment.videoId}`);
}

export async function toggleCreatorVerified(formData: FormData) {
  await requireAdmin();
  const creatorId = String(formData.get("creatorId"));

  const [creator] = await db
    .select({ isVerified: creators.isVerified })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);
  if (!creator) return;

  await db
    .update(creators)
    .set({ isVerified: !creator.isVerified, updatedAt: new Date() })
    .where(eq(creators.id, creatorId));

  revalidatePath("/admin/creators");
}

const waitlistStatusValues = waitlistStatusEnum.enumValues;
const waitlistUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(waitlistStatusValues as [string, ...string[]]),
});

export async function updateWaitlistStatus(formData: FormData) {
  await requireAdmin();
  const parsed = waitlistUpdateSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;

  await db
    .update(creatorWaitlist)
    .set({ status: parsed.data.status as (typeof waitlistStatusValues)[number] })
    .where(eq(creatorWaitlist.id, parsed.data.id));

  revalidatePath("/admin/creators");
}
