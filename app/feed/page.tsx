import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getFeed } from "@/lib/feed/get-feed";

export const metadata: Metadata = {
  title: "Feed",
  description: "The curated vidnex feed - Afrobeats and Nigerian entertainment, hand-picked.",
};

const SCENE = "afrobeats";

// Explicit, not inferred: this page has no auth-gate and its first async
// call is a DB read (via getFeed), so Next can't reliably discover it
// needs to be dynamic before that read runs - see DECISIONS.md. Without
// this, `next build` tries to prerender it and a placeholder/unreachable
// DATABASE_URL takes down the whole build, not just this route.
export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const feed = await getFeed(SCENE);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-12">
        <Container>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">The Feed</h1>
          <p className="mt-2 text-ink-muted">
            Curated, not algorithmic - editorially picked videos from the Afrobeats scene.
          </p>

          {feed.length === 0 ? (
            <p className="mt-16 text-center text-ink-muted">
              Nothing here yet - check back soon, or{" "}
              <Link href="/creators" className="text-coral hover:underline">
                bring your videos to vidnex
              </Link>
              .
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {feed.map((item) => (
                <Link
                  key={item.id}
                  href={`/watch/${item.id}`}
                  className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-canvas-overlay border border-border"
                >
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-ink-faint text-xs">
                      No thumbnail
                    </div>
                  )}
                  {item.featuredRank != null && (
                    <Badge tone="brand" className="absolute top-2 left-2">
                      Featured
                    </Badge>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate">{item.title || "Untitled"}</p>
                    <p className="text-white/70 text-[11px] truncate">{item.creatorDisplayName}</p>
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
