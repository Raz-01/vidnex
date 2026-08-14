import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators, memberships, tokenLedgerEntries, users, videos } from "@/lib/db/schema";
import { createCreatorProfile } from "@/lib/creators/actions";
import { tokenLedger } from "@/lib/token/db-ledger";
import { cashOut } from "@/lib/token/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VideoStatusBadge } from "@/components/video/video-status-badge";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check your details and try again.",
  handle_taken: "That handle is already taken - try another.",
  insufficient_balance: "You don't have that many tokens to cash out.",
  forbidden: "That didn't work.",
};

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; cashedOut?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error, cashedOut } = await searchParams;
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

  const [creatorVideos, balance, recentActivity, activeMembers] = await Promise.all([
    db.select().from(videos).where(eq(videos.creatorId, row.creator.id)).orderBy(desc(videos.createdAt)).limit(20),
    tokenLedger.getBalance({ type: "creator", id: row.creator.id }),
    db
      .select({ entry: tokenLedgerEntries, name: users.name })
      .from(tokenLedgerEntries)
      .leftJoin(users, eq(tokenLedgerEntries.relatedUserId, users.id))
      .where(
        and(
          eq(tokenLedgerEntries.accountType, "creator"),
          eq(tokenLedgerEntries.accountId, row.creator.id),
          inArray(tokenLedgerEntries.entryType, ["support_in", "membership_in", "boost_creator_in"]),
        ),
      )
      .orderBy(desc(tokenLedgerEntries.createdAt))
      .limit(10),
    db
      .select({ membership: memberships, name: users.name })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(and(eq(memberships.creatorId, row.creator.id), eq(memberships.status, "active")))
      .orderBy(desc(memberships.createdAt))
      .limit(20),
  ]);

  const ACTIVITY_LABELS: Record<string, string> = {
    support_in: "tipped",
    membership_in: "joined as a member",
    boost_creator_in: "boosted",
  };

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

          {errorMessage && (
            <p className="mt-6 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {errorMessage}
            </p>
          )}
          {cashedOut && (
            <p className="mt-6 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              Cashed out {cashedOut} tokens (simulated - no real payout in the MVP).
            </p>
          )}

          <div className="mt-8 grid sm:grid-cols-2 gap-4">
            <Card className="text-center">
              <p className="text-sm text-ink-muted">Balance</p>
              <p className="mt-1 font-display text-4xl font-bold text-token">{balance}</p>
              <form action={cashOut} className="mt-4 flex items-center justify-center gap-2">
                <input type="hidden" name="creatorId" value={row.creator.id} />
                <input
                  type="number"
                  name="amount"
                  min={1}
                  max={balance}
                  defaultValue={balance || undefined}
                  disabled={balance <= 0}
                  className="h-9 w-24 rounded-lg border border-border bg-canvas px-3 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-coral disabled:opacity-40"
                />
                <Button type="submit" variant="secondary" size="sm" disabled={balance <= 0}>
                  Cash out
                </Button>
              </form>
              <p className="mt-2 text-xs text-ink-faint">
                Simulated / manual for the MVP - see CLAUDE.md DECISION 0.
              </p>
            </Card>

            <Card>
              <p className="text-sm text-ink-muted">
                Members <span className="text-ink">({activeMembers.length})</span>
              </p>
              {activeMembers.length === 0 ? (
                <p className="mt-3 text-sm text-ink-faint">No members yet.</p>
              ) : (
                <ul className="mt-3 grid gap-1.5 max-h-32 overflow-y-auto">
                  {activeMembers.map(({ membership, name }) => (
                    <li key={membership.id} className="text-sm truncate">
                      {name ?? "vidnex user"}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <h2 className="mt-10 font-display text-lg font-bold">Recent activity</h2>
          {recentActivity.length === 0 ? (
            <Card className="mt-4">
              <p className="text-ink-muted text-sm">
                Nothing yet - Support, Boost, and Membership all show up here.
              </p>
            </Card>
          ) : (
            <div className="mt-4 grid gap-2">
              {recentActivity.map(({ entry, name }) => (
                <Card key={entry.id} className="flex items-center justify-between py-3">
                  <p className="text-sm">
                    <span className="font-medium">{name ?? "vidnex user"}</span>{" "}
                    <span className="text-ink-muted">{ACTIVITY_LABELS[entry.entryType] ?? entry.entryType}</span>
                  </p>
                  <span className="text-token font-semibold text-sm">+{entry.amount}</span>
                </Card>
              ))}
            </div>
          )}

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
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{v.title || "Untitled video"}</p>
                      {v.isExclusive && (
                        <Badge tone="token" className="shrink-0">
                          {v.accessPriceTokens} to unlock
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-ink-faint">
                      {new Date(v.createdAt).toLocaleDateString()} - {v.viewCount} views -{" "}
                      {v.likeCount} likes - {v.commentCount} comments - boost score {v.boostScore}
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
