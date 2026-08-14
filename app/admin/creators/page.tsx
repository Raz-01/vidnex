import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { creators, creatorWaitlist, users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/require-admin";
import { toggleCreatorVerified, updateWaitlistStatus } from "@/lib/admin/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Creators", robots: { index: false } };

const WAITLIST_STATUSES = ["pending", "invited", "onboarded"] as const;

export default async function AdminCreatorsPage() {
  await requireAdmin();

  const [allCreators, waitlist] = await Promise.all([
    db
      .select({ creator: creators, handle: users.handle })
      .from(creators)
      .innerJoin(users, eq(creators.userId, users.id))
      .orderBy(desc(creators.createdAt)),
    db.select().from(creatorWaitlist).orderBy(desc(creatorWaitlist.createdAt)).limit(50),
  ]);

  return (
    <>
      <SiteHeader />
      <AdminNav active="/admin/creators" />
      <main className="flex-1 py-12">
        <Container>
          <h1 className="font-display text-2xl font-bold">Creators</h1>

          <h2 className="mt-8 font-display font-bold">
            Creator waitlist ({waitlist.filter((w) => w.status === "pending").length} pending)
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            From{" "}
            <Link href="/creators" className="text-coral hover:underline">
              /creators
            </Link>{" "}
            - the real launch funnel, reviewed by hand (TOKENOMICS.md).
          </p>
          {waitlist.length === 0 ? (
            <Card className="mt-3">
              <p className="text-sm text-ink-muted">No waitlist entries yet.</p>
            </Card>
          ) : (
            <div className="mt-3 grid gap-2">
              {waitlist.map((entry) => (
                <Card key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {entry.name} <span className="text-ink-faint font-normal">{entry.email}</span>
                    </p>
                    <p className="text-xs text-ink-faint truncate max-w-md">{entry.primaryLink}</p>
                  </div>
                  <form action={updateWaitlistStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={entry.id} />
                    <select
                      name="status"
                      defaultValue={entry.status}
                      className="h-9 rounded-lg border border-border bg-canvas px-2 text-sm text-ink"
                    >
                      {WAITLIST_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" variant="secondary" size="sm">
                      Update
                    </Button>
                  </form>
                </Card>
              ))}
            </div>
          )}

          <h2 className="mt-10 font-display font-bold">All creators ({allCreators.length})</h2>
          <div className="mt-3 grid gap-2">
            {allCreators.map(({ creator, handle }) => (
              <Card key={creator.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  {creator.isVerified && <Badge tone="brand">Verified</Badge>}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{creator.displayName}</p>
                    <p className="text-xs text-ink-faint">@{handle}</p>
                  </div>
                </div>
                <form action={toggleCreatorVerified}>
                  <input type="hidden" name="creatorId" value={creator.id} />
                  <Button type="submit" variant="secondary" size="sm">
                    {creator.isVerified ? "Unverify" : "Verify"}
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
