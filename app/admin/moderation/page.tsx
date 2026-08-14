import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { comments, creators, users, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin/require-admin";
import { toggleCommentRemoved, toggleVideoRemoved } from "@/lib/admin/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: "Moderation", robots: { index: false } };

export default async function AdminModerationPage() {
  await requireAdmin();

  const [recentVideos, recentComments] = await Promise.all([
    db
      .select({ video: videos, creatorName: creators.displayName })
      .from(videos)
      .innerJoin(creators, eq(videos.creatorId, creators.id))
      .orderBy(desc(videos.createdAt))
      .limit(30),
    db
      .select({ comment: comments, name: users.name, videoTitle: videos.title })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .innerJoin(videos, eq(comments.videoId, videos.id))
      .orderBy(desc(comments.createdAt))
      .limit(30),
  ]);

  return (
    <>
      <SiteHeader />
      <AdminNav active="/admin/moderation" />
      <main className="flex-1 py-12">
        <Container>
          <h1 className="font-display text-2xl font-bold">Moderation</h1>
          <p className="mt-2 text-ink-muted">
            Removing something hides it from public pages without deleting the row - reversible.
          </p>

          <h2 className="mt-8 font-display font-bold">Recent videos</h2>
          <div className="mt-3 grid gap-2">
            {recentVideos.map(({ video, creatorName }) => (
              <Card key={video.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex items-center gap-2">
                  {video.isRemoved && <Badge tone="neutral">Removed</Badge>}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{video.title || "Untitled video"}</p>
                    <p className="text-xs text-ink-faint">{creatorName}</p>
                  </div>
                </div>
                <form action={toggleVideoRemoved}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <Button type="submit" variant={video.isRemoved ? "secondary" : "ghost"} size="sm">
                    {video.isRemoved ? "Restore" : "Remove"}
                  </Button>
                </form>
              </Card>
            ))}
          </div>

          <h2 className="mt-10 font-display font-bold">Recent comments</h2>
          <div className="mt-3 grid gap-2">
            {recentComments.map(({ comment, name, videoTitle }) => (
              <Card key={comment.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0 flex items-center gap-2">
                  {comment.isRemoved && <Badge tone="neutral">Removed</Badge>}
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <span className="font-medium">{name ?? "vidnex user"}</span>: {comment.body}
                    </p>
                    <p className="text-xs text-ink-faint">on {videoTitle || "Untitled video"}</p>
                  </div>
                </div>
                <form action={toggleCommentRemoved}>
                  <input type="hidden" name="commentId" value={comment.id} />
                  <Button type="submit" variant={comment.isRemoved ? "secondary" : "ghost"} size="sm">
                    {comment.isRemoved ? "Restore" : "Remove"}
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
