import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { accessUnlocks, comments, creators, follows, likes, users, videos } from "@/lib/db/schema";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoPlayer } from "@/components/video/video-player";
import { VideoStatusBadge } from "@/components/video/video-status-badge";
import { FollowButton } from "@/components/social/follow-button";
import { LikeButton } from "@/components/social/like-button";
import { ShareButton } from "@/components/social/share-button";
import { addComment } from "@/lib/social/actions";
import { tipCreator, boostVideoAction, unlockVideoAccess } from "@/lib/token/actions";
import { SUPPORT_PRESETS, BOOST_PRESETS } from "@/lib/token/policy";

async function getVideo(videoId: string) {
  const [row] = await db
    .select({ video: videos, creator: creators, handle: users.handle })
    .from(videos)
    .innerJoin(creators, eq(videos.creatorId, creators.id))
    .innerJoin(users, eq(creators.userId, users.id))
    .where(eq(videos.id, videoId))
    .limit(1);
  return row;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  const row = await getVideo(videoId);
  if (!row) return { title: "Video not found" };

  return {
    title: row.video.title || `${row.creator.displayName} on vidnex`,
    description: `Watch ${row.creator.displayName} on vidnex.`,
    openGraph: { images: row.video.thumbnailUrl ? [row.video.thumbnailUrl] : undefined },
  };
}

const SPEND_ERROR_MESSAGES: Record<string, string> = {
  insufficient_balance: "Not enough tokens for that - visit Rewards to earn more.",
  invalid: "Something went wrong with that request.",
};

export default async function WatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ tipped?: string; boosted?: string; unlocked?: string; error?: string }>;
}) {
  const { videoId } = await params;
  const row = await getVideo(videoId);
  if (!row) notFound();

  const session = await auth();
  const isOwner = session?.user?.id && row.creator.userId === session.user.id;

  if (row.video.status !== "ready" && !isOwner) notFound();

  const { tipped, boosted, unlocked, error } = await searchParams;

  const [isLiked, isFollowing, hasUnlocked, commentRows] = await Promise.all([
    session?.user
      ? db
          .select({ userId: likes.userId })
          .from(likes)
          .where(and(eq(likes.userId, session.user.id), eq(likes.videoId, videoId)))
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    session?.user
      ? db
          .select({ followerId: follows.followerId })
          .from(follows)
          .where(and(eq(follows.followerId, session.user.id), eq(follows.creatorId, row.creator.id)))
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    session?.user
      ? db
          .select({ userId: accessUnlocks.userId })
          .from(accessUnlocks)
          .where(and(eq(accessUnlocks.userId, session.user.id), eq(accessUnlocks.videoId, videoId)))
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    db
      .select({ comment: comments, name: users.name })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt))
      .limit(50),
  ]);

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/watch/${videoId}`;
  const locked = row.video.isExclusive && !isOwner && !hasUnlocked;
  const errorMessage = error ? (SPEND_ERROR_MESSAGES[error] ?? SPEND_ERROR_MESSAGES.invalid) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-10">
        <Container className="max-w-4xl">
          {row.video.status !== "ready" ? (
            <div className="max-w-md mx-auto text-center py-16">
              <VideoStatusBadge status={row.video.status} />
              <p className="mt-4 text-ink-muted">
                {row.video.status === "errored"
                  ? "Something went wrong processing this video."
                  : "Still processing - this can take a minute or two. Refresh shortly."}
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[minmax(0,26rem)_1fr] gap-8 items-start">
              <div className="mx-auto w-full max-w-sm">
                {locked ? (
                  <div
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-canvas-overlay flex flex-col items-center justify-center gap-4 text-center p-6"
                    style={
                      row.video.thumbnailUrl
                        ? {
                            backgroundImage: `linear-gradient(rgba(11,10,14,0.75), rgba(11,10,14,0.9)), url(${row.video.thumbnailUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    <Badge tone="token">Exclusive</Badge>
                    <p className="text-ink-muted text-sm max-w-[220px]">
                      This video is a token-gated drop from {row.creator.displayName}.
                    </p>
                    {session?.user ? (
                      <form action={unlockVideoAccess}>
                        <input type="hidden" name="videoId" value={videoId} />
                        <Button type="submit" variant="token" size="md">
                          Unlock for {row.video.accessPriceTokens} tokens
                        </Button>
                      </form>
                    ) : (
                      <Link href="/login">
                        <Button type="button" variant="token" size="md">
                          Sign in to unlock
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <VideoPlayer
                    playbackId={row.video.muxPlaybackId!}
                    title={row.video.title}
                    thumbnailUrl={row.video.thumbnailUrl}
                    autoPlay
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between gap-4">
                  <Link href={`/${row.handle}`} className="flex items-center gap-3 min-w-0">
                    <div
                      aria-hidden
                      className="h-10 w-10 shrink-0 rounded-full bg-flame flex items-center justify-center text-sm font-display font-bold text-white"
                    >
                      {row.creator.displayName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.creator.displayName}</p>
                      <p className="text-xs text-ink-muted">@{row.handle}</p>
                    </div>
                  </Link>
                  {!isOwner && (
                    <FollowButton
                      creatorId={row.creator.id}
                      initialFollowing={isFollowing}
                      isSignedIn={!!session?.user}
                      size="sm"
                    />
                  )}
                </div>

                {row.video.title && <p className="mt-4">{row.video.title}</p>}

                <div className="mt-6 flex items-center gap-6">
                  <LikeButton
                    videoId={videoId}
                    initialLiked={isLiked}
                    initialCount={row.video.likeCount}
                    isSignedIn={!!session?.user}
                  />
                  <ShareButton url={shareUrl} title={row.video.title || row.creator.displayName} />
                </div>

                {(tipped || boosted || unlocked) && (
                  <p className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                    {tipped && `Tipped ${tipped} tokens - thank you!`}
                    {boosted && `Boosted with ${boosted} tokens.`}
                    {unlocked && "Unlocked!"}
                  </p>
                )}
                {errorMessage && (
                  <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                    {errorMessage}
                  </p>
                )}

                {!isOwner && session?.user && (
                  <div className="mt-6 grid sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm font-medium mb-2">Support</p>
                      <form action={tipCreator} className="flex flex-wrap gap-2">
                        <input type="hidden" name="creatorId" value={row.creator.id} />
                        <input type="hidden" name="videoId" value={videoId} />
                        {SUPPORT_PRESETS.map((amount) => (
                          <button
                            key={amount}
                            type="submit"
                            name="amount"
                            value={amount}
                            className="h-9 px-3 rounded-full text-sm font-semibold bg-flame text-white hover:brightness-110"
                          >
                            {amount}
                          </button>
                        ))}
                      </form>
                    </div>
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-sm font-medium mb-2">Boost</p>
                      <form action={boostVideoAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="creatorId" value={row.creator.id} />
                        <input type="hidden" name="videoId" value={videoId} />
                        {BOOST_PRESETS.map((amount) => (
                          <button
                            key={amount}
                            type="submit"
                            name="amount"
                            value={amount}
                            className="h-9 px-3 rounded-full text-sm font-semibold bg-token text-[#241900] hover:brightness-105"
                          >
                            {amount}
                          </button>
                        ))}
                      </form>
                    </div>
                  </div>
                )}
                {!session?.user && (
                  <p className="mt-6 text-sm text-ink-muted">
                    <Link href="/login" className="text-coral hover:underline">
                      Sign in
                    </Link>{" "}
                    to support, boost, or comment.
                  </p>
                )}

                <h2 className="mt-8 font-display font-bold">
                  Comments <span className="text-ink-faint">({row.video.commentCount})</span>
                </h2>

                {session?.user ? (
                  <form action={addComment.bind(null, videoId)} className="mt-4 flex gap-2">
                    <input
                      name="body"
                      required
                      maxLength={1000}
                      placeholder="Add a comment..."
                      className="h-11 flex-1 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                    />
                    <Button type="submit" size="md">
                      Post
                    </Button>
                  </form>
                ) : null}

                <div className="mt-6 grid gap-4">
                  {commentRows.map(({ comment, name }) => (
                    <div key={comment.id}>
                      <p className="text-sm font-medium">{name ?? "vidnex user"}</p>
                      <p className="text-sm text-ink-muted">{comment.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
