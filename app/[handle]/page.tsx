import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators, follows, memberships, users, videos } from "@/lib/db/schema";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FollowButton } from "@/components/social/follow-button";
import { joinMembership, leaveMembership } from "@/lib/token/actions";

async function getCreator(handle: string) {
  const [row] = await db
    .select({ creator: creators, user: users })
    .from(creators)
    .innerJoin(users, eq(creators.userId, users.id))
    .where(eq(users.handle, handle))
    .limit(1);
  return row;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const row = await getCreator(handle);
  if (!row) return { title: "Creator not found" };

  return {
    title: row.creator.displayName,
    description: row.creator.bio || `${row.creator.displayName} on vidnex.`,
    openGraph: {
      title: `${row.creator.displayName} on vidnex`,
      description: row.creator.bio || undefined,
    },
  };
}

const LINK_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  x: "X",
  website: "Website",
};

const MEMBERSHIP_ERROR_MESSAGES: Record<string, string> = {
  insufficient_balance: "Not enough tokens for that - visit Rewards to earn more.",
  already_member: "You're already a member.",
  invalid: "Something went wrong with that request.",
};

export default async function CreatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ joined?: string; left?: string; error?: string }>;
}) {
  const { handle } = await params;
  const row = await getCreator(handle);
  if (!row) notFound();

  const session = await auth();
  const isOwnPage = session?.user?.id === row.user.id;
  const { joined, left, error } = await searchParams;

  const [isFollowing, activeMembership] = await Promise.all([
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
          .select({ id: memberships.id })
          .from(memberships)
          .where(
            and(
              eq(memberships.userId, session.user.id),
              eq(memberships.creatorId, row.creator.id),
              eq(memberships.status, "active"),
            ),
          )
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
  ]);

  const creatorVideos = await db
    .select()
    .from(videos)
    .where(
      and(eq(videos.creatorId, row.creator.id), eq(videos.status, "ready"), eq(videos.isRemoved, false)),
    )
    .orderBy(desc(videos.createdAt))
    .limit(60);

  const links = Object.entries(row.creator.links).filter(([, url]) => url);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-border-subtle bg-canvas-raised/40">
          <Container className="py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div
                aria-hidden
                className="h-24 w-24 shrink-0 rounded-full bg-flame flex items-center justify-center text-3xl font-display font-bold text-white"
              >
                {row.creator.displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold">
                    {row.creator.displayName}
                  </h1>
                  {row.creator.isVerified && <Badge tone="brand">Verified</Badge>}
                </div>
                <p className="text-ink-muted">@{handle}</p>
                {row.creator.bio && (
                  <p className="mt-2 text-ink-muted max-w-xl leading-relaxed">{row.creator.bio}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="text-sm text-ink-muted">
                    <strong className="text-ink">{row.creator.followerCount}</strong> followers
                  </span>
                  {links.map(([key, url]) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm text-coral hover:underline"
                    >
                      {LINK_LABELS[key] ?? key}
                    </a>
                  ))}
                </div>
              </div>
              {!isOwnPage && (
                <FollowButton
                  creatorId={row.creator.id}
                  initialFollowing={isFollowing}
                  isSignedIn={!!session?.user}
                />
              )}
              {isOwnPage && (
                <LinkButton href="/studio" variant="secondary" size="sm">
                  Manage
                </LinkButton>
              )}
            </div>
          </Container>
        </div>

        {(joined || left || error) && (
          <Container className="pt-8">
            {(joined || left) && (
              <p className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                {joined && "You're a member now - thank you for the support."}
                {left && "Membership canceled."}
              </p>
            )}
            {error && (
              <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {MEMBERSHIP_ERROR_MESSAGES[error] ?? MEMBERSHIP_ERROR_MESSAGES.invalid}
              </p>
            )}
          </Container>
        )}

        {!isOwnPage && row.creator.membershipPriceTokens && (
          <Container className="pt-8">
            <Card className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display font-bold">
                  {activeMembership ? "You're a member" : "Join the fan club"}
                </p>
                <p className="text-sm text-ink-muted">
                  {row.creator.membershipPriceTokens} tokens / month - direct support, no
                  middleman.
                </p>
              </div>
              {session?.user ? (
                activeMembership ? (
                  <form action={leaveMembership}>
                    <input type="hidden" name="creatorId" value={row.creator.id} />
                    <input type="hidden" name="handle" value={handle} />
                    <Button type="submit" variant="secondary" size="sm">
                      Cancel membership
                    </Button>
                  </form>
                ) : (
                  <form action={joinMembership}>
                    <input type="hidden" name="creatorId" value={row.creator.id} />
                    <input type="hidden" name="handle" value={handle} />
                    <Button type="submit" variant="token" size="sm">
                      Join for {row.creator.membershipPriceTokens}/mo
                    </Button>
                  </form>
                )
              ) : (
                <LinkButton href="/login" variant="token" size="sm">
                  Sign in to join
                </LinkButton>
              )}
            </Card>
          </Container>
        )}

        <Container className="py-12">
          {creatorVideos.length === 0 ? (
            <p className="text-center text-ink-muted py-16">No videos yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {creatorVideos.map((v) => (
                <Link
                  key={v.id}
                  href={`/watch/${v.id}`}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-canvas-overlay border border-border"
                >
                  {v.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-ink-faint text-xs">
                      No thumbnail
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate">{v.title || "Untitled"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
