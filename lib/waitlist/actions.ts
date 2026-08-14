"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { creatorWaitlist } from "@/lib/db/schema";
import { publicFormRatelimit } from "@/lib/db/redis";
import { trackEvent } from "@/lib/events/track";

const waitlistSchema = z.object({
  name: z.string().trim().min(1, "required").max(120),
  email: z.string().trim().email("invalid_email").max(255),
  primaryLink: z.string().trim().min(2, "required").max(200),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

/**
 * Registers creator interest (M1). This is a queue for manual review, not a
 * self-serve signup - see TOKENOMICS.md on creator-side verification.
 * Idempotent on email: re-submitting the same email is treated as success
 * rather than leaking "you're already on the list" (nothing sensitive
 * either way, just avoids a confusing error for a well-intentioned retry).
 */
export async function joinCreatorWaitlist(formData: FormData) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success: withinLimit } = await publicFormRatelimit.limit(`waitlist:${ip}`);
  if (!withinLimit) {
    redirect("/creators?error=rate_limited");
  }

  const parsed = waitlistSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    primaryLink: formData.get("primaryLink"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirect("/creators?error=invalid");
  }

  const { name, email, primaryLink, note } = parsed.data;

  await db
    .insert(creatorWaitlist)
    .values({ name, email, primaryLink, note: note || null })
    .onConflictDoNothing({ target: creatorWaitlist.email });

  await trackEvent({ name: "waitlist_joined", anonymousId: email });

  redirect("/creators/thanks");
}
