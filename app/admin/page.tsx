import type { Metadata } from "next";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { creators, creatorWaitlist, users, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/require-admin";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [[{ userCount }], [{ creatorCount }], [{ videoCount }], [{ pendingWaitlist }]] = await Promise.all([
    db.select({ userCount: count() }).from(users),
    db.select({ creatorCount: count() }).from(creators),
    db.select({ videoCount: count() }).from(videos),
    db.select({ pendingWaitlist: count() }).from(creatorWaitlist).where(eq(creatorWaitlist.status, "pending")),
  ]);

  const stats = [
    { label: "Users", value: userCount },
    { label: "Creators", value: creatorCount },
    { label: "Videos", value: videoCount },
    { label: "Waitlist pending review", value: pendingWaitlist },
  ];

  return (
    <>
      <SiteHeader />
      <AdminNav active="/admin" />
      <main className="flex-1 py-12">
        <Container>
          <h1 className="font-display text-2xl font-bold">Admin</h1>
          <p className="mt-2 text-ink-muted">
            Feed curation, moderation, creator verification, and investor metrics.
          </p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label} className="text-center">
                <p className="font-display text-3xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm text-ink-muted">{s.label}</p>
              </Card>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
