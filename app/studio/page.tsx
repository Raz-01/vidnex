import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators, users, videos } from "@/lib/db/schema";
import { createCreatorProfile } from "@/lib/creators/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoStatusBadge } from "@/components/video/video-status-badge";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check your details and try again.",
  handle_taken: "That handle is already taken - try another.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid) : null;

  const [row] = await db
    .select({ creator: creators, handle: users.handle })
    .from(creators)
    .innerJoin(users, eq(creators.userId, users.id))
    .where(eq(creators.userId, session.user.id))
    .limit(1);

  if (!row) {
    return (
      <>
        <SiteHeader />
        <main className="flex-1 py-16">
          <Container className="max-w-lg">
            <h1 className="font-display text-2xl font-bold">Set up your creator profile</h1>
            <p className="mt-2 text-ink-muted">
              This is your public page - fans find you here and it&rsquo;s where you upload.
            </p>

            {errorMessage && (
              <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {errorMessage}
              </p>
            )}

            <Card className="mt-6">
              <form action={createCreatorProfile} className="grid gap-4">
                <div className="grid gap-1.5">
                  <label htmlFor="handle" className="text-sm font-medium text-ink-muted">
                    Handle
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-faint">vidnex.app/</span>
                    <input
                      id="handle"
                      name="handle"
                      required
                      pattern="[a-z0-9_]{3,30}"
                      maxLength={30}
                      placeholder="yourname"
                      className="h-11 flex-1 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                    />
                  </div>
                  <p className="text-xs text-ink-faint">
                    Lowercase letters, numbers, underscore. Can&rsquo;t be changed later.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="displayName" className="text-sm font-medium text-ink-muted">
                    Display name
                  </label>
                  <input
                    id="displayName"
                    name="displayName"
                    required
                    maxLength={80}
                    placeholder="Your name or stage name"
                    className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="bio" className="text-sm font-medium text-ink-muted">
                    Bio <span className="text-ink-faint">(optional)</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    maxLength={300}
                    rows={3}
                    placeholder="Tell fans what you're about"
                    className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral resize-none"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input
                    name="tiktok"
                    maxLength={200}
                    placeholder="TikTok URL"
                    className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                  />
                  <input
                    name="instagram"
                    maxLength={200}
                    placeholder="Instagram URL"
                    className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                  />
                  <input
                    name="youtube"
                    maxLength={200}
                    placeholder="YouTube URL"
                    className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                  />
                </div>
                <Button type="submit" size="lg" className="mt-2">
                  Create my creator page
                </Button>
              </form>
            </Card>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  const creatorVideos = await db
    .select()
    .from(videos)
    .where(eq(videos.creatorId, row.creator.id))
    .orderBy(desc(videos.createdAt))
    .limit(20);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">{row.creator.displayName}</h1>
              <Link href={`/${row.handle}`} className="text-sm text-ink-muted hover:text-ink">
                vidnex.app/{row.handle} &rarr;
              </Link>
            </div>
            <div className="flex gap-3">
              <LinkButton href="/studio/profile" variant="secondary" size="sm">
                Edit profile
              </LinkButton>
              <LinkButton href="/studio/upload" size="sm">
                Upload video
              </LinkButton>
            </div>
          </div>

          <h2 className="mt-10 font-display text-lg font-bold">Your videos</h2>
          {creatorVideos.length === 0 ? (
            <Card className="mt-4">
              <p className="text-ink-muted">
                No videos yet.{" "}
                <Link href="/studio/upload" className="text-coral hover:underline">
                  Upload your first one
                </Link>
                .
              </p>
            </Card>
          ) : (
            <div className="mt-4 grid gap-3">
              {creatorVideos.map((v) => (
                <Card key={v.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{v.title || "Untitled video"}</p>
                    <p className="text-xs text-ink-faint">
                      {new Date(v.createdAt).toLocaleDateString()} - {v.viewCount} views -{" "}
                      {v.likeCount} likes
                    </p>
                  </div>
                  <VideoStatusBadge status={v.status} />
                </Card>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
