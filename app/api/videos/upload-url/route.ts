import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators, videos } from "@/lib/db/schema";
import { createDirectUpload } from "@/lib/video/mux";

const bodySchema = z.object({
  title: z.string().trim().max(200).optional(),
  isExclusive: z.boolean().optional(),
  accessPriceTokens: z.number().int().positive().optional(),
});

/**
 * Creates a pending `videos` row and a Mux direct upload URL for it. The
 * client (components/video/upload-video-form.tsx) then uploads the file
 * bytes straight to Mux with @mux/upchunk - this route never sees them.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { title, isExclusive, accessPriceTokens } = parsed.data;

  const [creator] = await db
    .select({ id: creators.id })
    .from(creators)
    .where(eq(creators.userId, session.user.id))
    .limit(1);

  if (!creator) {
    return NextResponse.json(
      { error: "no_creator_profile", message: "Set up your creator profile first." },
      { status: 403 },
    );
  }

  const [video] = await db
    .insert(videos)
    .values({
      creatorId: creator.id,
      status: "pending",
      title: title || null,
      isExclusive: !!(isExclusive && accessPriceTokens),
      accessPriceTokens: isExclusive ? (accessPriceTokens ?? null) : null,
    })
    .returning({ id: videos.id });

  const upload = await createDirectUpload(video.id);

  await db.update(videos).set({ muxUploadId: upload.id }).where(eq(videos.id, video.id));

  return NextResponse.json({ videoId: video.id, uploadUrl: upload.url });
}
