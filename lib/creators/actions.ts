"use server";

import { redirect } from "next/navigation";
import { eq, and, ne } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators, users } from "@/lib/db/schema";
import type { CreatorLinks } from "@/lib/db/schema";
import { trackEvent } from "@/lib/events/track";

const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3-30 characters: letters, numbers, underscore only");

const linkField = z.string().trim().max(200).optional().or(z.literal(""));

const createProfileSchema = z.object({
  handle: handleSchema,
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  tiktok: linkField,
  instagram: linkField,
  youtube: linkField,
});

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  tiktok: linkField,
  instagram: linkField,
  youtube: linkField,
  membershipPriceTokens: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().positive().optional(),
  ),
});

function buildLinks(input: { tiktok?: string; instagram?: string; youtube?: string }): CreatorLinks {
  const links: CreatorLinks = {};
  if (input.tiktok) links.tiktok = input.tiktok;
  if (input.instagram) links.instagram = input.instagram;
  if (input.youtube) links.youtube = input.youtube;
  return links;
}

/**
 * Self-serve creator profile creation. TOKENOMICS.md concentrates
 * verification on the creator side ("manually approved for MVP") via the
 * M1 waitlist for the real launch funnel - this is the product-side path
 * so M2/M3 (video, tokens) are actually demoable end to end. `isVerified`
 * stays false until an admin flips it (M4).
 */
export async function createCreatorProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [existing] = await db
    .select({ id: creators.id })
    .from(creators)
    .where(eq(creators.userId, session.user.id))
    .limit(1);
  if (existing) redirect("/studio");

  const parsed = createProfileSchema.safeParse({
    handle: formData.get("handle"),
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    tiktok: formData.get("tiktok"),
    instagram: formData.get("instagram"),
    youtube: formData.get("youtube"),
  });
  if (!parsed.success) redirect("/studio?error=invalid");

  const { handle, displayName, bio, tiktok, instagram, youtube } = parsed.data;

  const [handleTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.handle, handle), ne(users.id, session.user.id)))
    .limit(1);
  if (handleTaken) redirect("/studio?error=handle_taken");

  await db.update(users).set({ handle, updatedAt: new Date() }).where(eq(users.id, session.user.id));
  await db.insert(creators).values({
    userId: session.user.id,
    displayName,
    bio: bio || null,
    links: buildLinks({ tiktok, instagram, youtube }),
  });

  await trackEvent({ name: "creator_profile_created", userId: session.user.id, properties: { handle } });

  redirect("/studio");
}

export async function updateCreatorProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
    tiktok: formData.get("tiktok"),
    instagram: formData.get("instagram"),
    youtube: formData.get("youtube"),
    membershipPriceTokens: formData.get("membershipPriceTokens"),
  });
  if (!parsed.success) redirect("/studio/profile?error=invalid");

  const { displayName, bio, tiktok, instagram, youtube, membershipPriceTokens } = parsed.data;

  await db
    .update(creators)
    .set({
      displayName,
      bio: bio || null,
      links: buildLinks({ tiktok, instagram, youtube }),
      membershipPriceTokens: membershipPriceTokens ?? null,
      updatedAt: new Date(),
    })
    .where(eq(creators.userId, session.user.id));

  redirect("/studio");
}
