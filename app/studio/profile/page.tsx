import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators } from "@/lib/db/schema";
import { updateCreatorProfile } from "@/lib/creators/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false } };

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { error } = await searchParams;

  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, session.user.id))
    .limit(1);
  if (!creator) redirect("/studio");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-lg">
          <h1 className="font-display text-2xl font-bold">Edit profile</h1>

          {error && (
            <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              Please check your details and try again.
            </p>
          )}

          <Card className="mt-6">
            <form action={updateCreatorProfile} className="grid gap-4">
              <div className="grid gap-1.5">
                <label htmlFor="displayName" className="text-sm font-medium text-ink-muted">
                  Display name
                </label>
                <input
                  id="displayName"
                  name="displayName"
                  required
                  maxLength={80}
                  defaultValue={creator.displayName}
                  className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-coral"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="bio" className="text-sm font-medium text-ink-muted">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  maxLength={300}
                  rows={3}
                  defaultValue={creator.bio ?? ""}
                  className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-coral resize-none"
                />
              </div>
              <div className="grid gap-3">
                <input
                  name="tiktok"
                  maxLength={200}
                  placeholder="TikTok URL"
                  defaultValue={creator.links.tiktok ?? ""}
                  className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                />
                <input
                  name="instagram"
                  maxLength={200}
                  placeholder="Instagram URL"
                  defaultValue={creator.links.instagram ?? ""}
                  className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                />
                <input
                  name="youtube"
                  maxLength={200}
                  placeholder="YouTube URL"
                  defaultValue={creator.links.youtube ?? ""}
                  className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="membershipPriceTokens" className="text-sm font-medium text-ink-muted">
                  Membership price <span className="text-ink-faint">(tokens/month, optional)</span>
                </label>
                <input
                  id="membershipPriceTokens"
                  name="membershipPriceTokens"
                  type="number"
                  min={1}
                  placeholder="Leave blank to not offer membership"
                  defaultValue={creator.membershipPriceTokens ?? ""}
                  className="h-11 w-48 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                />
              </div>
              <Button type="submit" size="lg" className="mt-2">
                Save changes
              </Button>
            </form>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
