"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { claimReward } from "./earn";
import { boostVideo, cancelMembership, simulateCashout, subscribeMembership, supportCreator, unlockAccess } from "./spend";
import { BOOST_PRESETS, SUPPORT_PRESETS } from "./policy";
import { trackEvent } from "@/lib/events/track";

function errorCode(err: unknown): string {
  return err instanceof Error ? err.message : "unknown";
}

export async function claimEarnReward() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user] = await db
    .select({ isVerifiedHuman: users.isVerifiedHuman })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user?.isVerifiedHuman) redirect("/rewards?error=not_verified");

  const result = await claimReward(session.user.id, true);
  if (result.amount > 0) {
    await trackEvent({ name: "earn_claimed", userId: session.user.id, properties: { amount: result.amount } });
  }
  revalidatePath("/rewards");
  redirect(`/rewards?claimed=${result.amount}`);
}

const tipSchema = z.object({
  creatorId: z.string().uuid(),
  videoId: z.string().uuid(),
  amount: z.coerce.number().int().refine((v) => (SUPPORT_PRESETS as readonly number[]).includes(v)),
});

export async function tipCreator(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const videoIdRaw = formData.get("videoId");
  const parsed = tipSchema.safeParse({
    creatorId: formData.get("creatorId"),
    videoId: videoIdRaw,
    amount: formData.get("amount"),
  });
  if (!parsed.success) redirect(`/watch/${videoIdRaw}?error=invalid`);

  try {
    await supportCreator({ userId: session.user.id, ...parsed.data });
  } catch (err) {
    redirect(`/watch/${parsed.data.videoId}?error=${errorCode(err)}`);
  }
  await trackEvent({
    name: "support_sent",
    userId: session.user.id,
    properties: { creatorId: parsed.data.creatorId, videoId: parsed.data.videoId, amount: parsed.data.amount },
  });

  revalidatePath(`/watch/${parsed.data.videoId}`);
  redirect(`/watch/${parsed.data.videoId}?tipped=${parsed.data.amount}`);
}

const boostSchema = z.object({
  creatorId: z.string().uuid(),
  videoId: z.string().uuid(),
  amount: z.coerce.number().int().refine((v) => (BOOST_PRESETS as readonly number[]).includes(v)),
});

export async function boostVideoAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const videoIdRaw = formData.get("videoId");
  const parsed = boostSchema.safeParse({
    creatorId: formData.get("creatorId"),
    videoId: videoIdRaw,
    amount: formData.get("amount"),
  });
  if (!parsed.success) redirect(`/watch/${videoIdRaw}?error=invalid`);

  try {
    await boostVideo({ userId: session.user.id, ...parsed.data });
  } catch (err) {
    redirect(`/watch/${parsed.data.videoId}?error=${errorCode(err)}`);
  }
  await trackEvent({
    name: "boost_sent",
    userId: session.user.id,
    properties: { creatorId: parsed.data.creatorId, videoId: parsed.data.videoId, amount: parsed.data.amount },
  });

  revalidatePath(`/watch/${parsed.data.videoId}`);
  redirect(`/watch/${parsed.data.videoId}?boosted=${parsed.data.amount}`);
}

export async function unlockVideoAccess(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const videoId = formData.get("videoId");
  const parsed = z.string().uuid().safeParse(videoId);
  if (!parsed.success) redirect(`/watch/${videoId}?error=invalid`);

  try {
    await unlockAccess({ userId: session.user.id, videoId: parsed.data });
  } catch (err) {
    redirect(`/watch/${parsed.data}?error=${errorCode(err)}`);
  }
  await trackEvent({ name: "access_unlocked", userId: session.user.id, properties: { videoId: parsed.data } });

  revalidatePath(`/watch/${parsed.data}`);
  redirect(`/watch/${parsed.data}?unlocked=1`);
}

export async function joinMembership(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const handle = String(formData.get("handle") ?? "");
  const creatorId = formData.get("creatorId");
  const parsed = z.string().uuid().safeParse(creatorId);
  if (!parsed.success) redirect(`/${handle}?error=invalid`);

  try {
    await subscribeMembership({ userId: session.user.id, creatorId: parsed.data });
  } catch (err) {
    redirect(`/${handle}?error=${errorCode(err)}`);
  }
  await trackEvent({ name: "membership_joined", userId: session.user.id, properties: { creatorId: parsed.data } });

  revalidatePath(`/${handle}`);
  redirect(`/${handle}?joined=1`);
}

export async function leaveMembership(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const handle = String(formData.get("handle") ?? "");
  const creatorId = formData.get("creatorId");
  const parsed = z.string().uuid().safeParse(creatorId);
  if (!parsed.success) redirect(`/${handle}?error=invalid`);

  await cancelMembership({ userId: session.user.id, creatorId: parsed.data });
  await trackEvent({ name: "membership_canceled", userId: session.user.id, properties: { creatorId: parsed.data } });
  revalidatePath(`/${handle}`);
  redirect(`/${handle}?left=1`);
}

const cashoutSchema = z.object({
  creatorId: z.string().uuid(),
  amount: z.coerce.number().int().positive(),
});

export async function cashOut(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = cashoutSchema.safeParse({
    creatorId: formData.get("creatorId"),
    amount: formData.get("amount"),
  });
  if (!parsed.success) redirect("/studio?error=invalid");

  try {
    await simulateCashout({ creatorId: parsed.data.creatorId, requestedByUserId: session.user.id, amount: parsed.data.amount });
  } catch (err) {
    redirect(`/studio?error=${errorCode(err)}`);
  }

  revalidatePath("/studio");
  redirect(`/studio?cashedOut=${parsed.data.amount}`);
}
