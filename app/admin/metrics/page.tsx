import type { Metadata } from "next";
import { and, count, countDistinct, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { comments, creators, events, follows, likes, memberships, tokenLedgerEntries, users, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/require-admin";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Metrics", robots: { index: false } };

const SPEND_TYPES = ["support_out", "access_out", "boost_out", "membership_out"] as const;

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="text-center">
      <p className="font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </Card>
  );
}

export default async function AdminMetricsPage() {
  await requireAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    [{ totalUsers }],
    [{ totalCreators }],
    [{ verifiedCreators }],
    [{ creators7d }],
    [{ totalVideos }],
    [{ totalLikes }],
    [{ totalComments }],
    [{ totalFollows }],
    [{ activeMemberships }],
    spendByType,
    [{ velocity7d }],
    [{ activeUsers7d }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ totalCreators: count() }).from(creators),
    db.select({ verifiedCreators: count() }).from(creators).where(eq(creators.isVerified, true)),
    db.select({ creators7d: count() }).from(creators).where(gte(creators.createdAt, sevenDaysAgo)),
    db.select({ totalVideos: count() }).from(videos),
    db.select({ totalLikes: count() }).from(likes),
    db.select({ totalComments: count() }).from(comments),
    db.select({ totalFollows: count() }).from(follows),
    db.select({ activeMemberships: count() }).from(memberships).where(eq(memberships.status, "active")),
    db
      .select({
        entryType: tokenLedgerEntries.entryType,
        total: sql<string>`coalesce(sum(-${tokenLedgerEntries.amount}), 0)`,
      })
      .from(tokenLedgerEntries)
      .where(
        and(inArray(tokenLedgerEntries.entryType, [...SPEND_TYPES]), gte(tokenLedgerEntries.createdAt, thirtyDaysAgo)),
      )
      .groupBy(tokenLedgerEntries.entryType),
    db
      .select({ velocity7d: sql<string>`coalesce(sum(-${tokenLedgerEntries.amount}), 0)` })
      .from(tokenLedgerEntries)
      .where(
        and(inArray(tokenLedgerEntries.entryType, [...SPEND_TYPES]), gte(tokenLedgerEntries.createdAt, sevenDaysAgo)),
      ),
    db
      .select({ activeUsers7d: countDistinct(events.userId) })
      .from(events)
      .where(gte(events.createdAt, sevenDaysAgo)),
  ]);

  const avgLikesPerVideo = totalVideos > 0 ? (totalLikes / totalVideos).toFixed(1) : "0";
  const retentionPct = totalUsers > 0 ? Math.round((activeUsers7d / totalUsers) * 100) : 0;
  const spendMap = Object.fromEntries(spendByType.map((r) => [r.entryType, Number(r.total)]));

  return (
    <>
      <SiteHeader />
      <AdminNav active="/admin/metrics" />
      <main className="flex-1 py-12">
        <Container>
          <h1 className="font-display text-2xl font-bold">Metrics</h1>
          <p className="mt-2 text-ink-muted">
            The numbers for a pitch deck. Zeros are expected on a fresh/placeholder-credential
            deploy - these are live queries, not sample data.
          </p>

          <h2 className="mt-8 font-display font-bold">Creators onboarded</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Total creators" value={totalCreators} />
            <StatTile label="Verified" value={verifiedCreators} />
            <StatTile label="New, last 7 days" value={creators7d} />
            <StatTile label="Total users" value={totalUsers} />
          </div>

          <h2 className="mt-10 font-display font-bold">Engagement</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Videos" value={totalVideos} />
            <StatTile label="Likes" value={totalLikes} hint={`${avgLikesPerVideo} avg / video`} />
            <StatTile label="Comments" value={totalComments} />
            <StatTile label="Follows" value={totalFollows} />
          </div>

          <h2 className="mt-10 font-display font-bold">Token velocity (tokens spent)</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Last 7 days" value={Number(velocity7d)} />
            <StatTile label="Support, 30d" value={spendMap.support_out ?? 0} />
            <StatTile label="Access, 30d" value={spendMap.access_out ?? 0} />
            <StatTile label="Boost, 30d" value={spendMap.boost_out ?? 0} />
          </div>

          <h2 className="mt-10 font-display font-bold">Membership uptake</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Active memberships" value={activeMemberships} />
            <StatTile label="Membership, 30d spend" value={spendMap.membership_out ?? 0} />
          </div>

          <h2 className="mt-10 font-display font-bold">Retention (proxy)</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Active users, 7d" value={activeUsers7d} hint="any tracked event" />
            <StatTile label="7d active / total users" value={`${retentionPct}%`} />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
