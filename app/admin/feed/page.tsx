import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { creators, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/require-admin";
import { featureVideo, moveVideoRank, unfeatureVideo } from "@/lib/admin/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Feed curation", robots: { index: false } };

export default async function AdminFeedPage() {
  await requireAdmin();

  const [featured, unfeatured] = await Promise.all([
    db
      .select({ video: videos, creatorName: creators.displayName })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .where(isNotNull(videos.featuredRank))
      .orderBy(asc(videos.featuredRank)),
    db
      .select({ video: videos, creatorName: creators.displayName })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .where(and(eq(videos.status, "ready"), eq(videos.isRemoved, false), isNull(videos.featuredRank)))
      .orderBy(desc(videos.createdAt))
      .limit(30),
  ]);

  return (
    <>
      <SiteHeader />
      <AdminNav active="/admin/feed" />
      <main className="flex-1 py-12">
        <Container>
          <h1 className="font-display text-2xl font-bold">Feed curation</h1>
          <p className="mt-2 text-ink-muted">
            Editorial, not algorithmic - featured videos appear first on{" "}
            <Link href="/feed" className="text-coral hover:underline">
              /feed
            </Link>
            , in this order, then everything else falls back to newest first.
          </p>

          <h2 className="mt-8 font-display font-bold">Featured ({featured.length})</h2>
          {featured.length === 0 ? (
            <Card className="mt-3">
              <p className="text-sm text-ink-muted">Nothing featured yet - feature something below.</p>
            </Card>
          ) : (
            <div className="mt-3 grid gap-2">
              {featured.map(({ video, creatorName }, i) => (
                <Card key={video.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge tone="brand">#{video.featuredRank}</Badge>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{video.title || "Untitled video"}</p>
                      <p className="text-xs text-ink-faint">{creatorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <form action={moveVideoRank}>
                      <input type="hidden" name="videoId" value={video.id} />
                      <input type="hidden" name="direction" value="up" />
                      <Button type="submit" variant="ghost" size="sm" disabled={i === 0}>
                        ↑
                      </Button>
                    </form>
                    <form action={moveVideoRank}>
                      <input type="hidden" name="videoId" value={video.id} />
                      <input type="hidden" name="direction" value="down" />
                      <Button type="submit" variant="ghost" size="sm" disabled={i === featured.length - 1}>
                        ↓
                      </Button>
                    </form>
                    <form action={unfeatureVideo}>
                      <input type="hidden" name="videoId" value={video.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Unfeature
                      </Button>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <h2 className="mt-10 font-display font-bold">Recent, unfeatured</h2>
          {unfeatured.length === 0 ? (
            <Card className="mt-3">
              <p className="text-sm text-ink-muted">No unfeatured ready videos.</p>
            </Card>
          ) : (
            <div className="mt-3 grid gap-2">
              {unfeatured.map(({ video, creatorName }) => (
                <Card key={video.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{video.title || "Untitled video"}</p>
                    <p className="text-xs text-ink-faint">
                      {creatorName} - {new Date(video.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <form action={featureVideo}>
                    <input type="hidden" name="videoId" value={video.id} />
                    <Button type="submit" size="sm">
                      Feature
                    </Button>
                  </form>
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
