import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { creators } from "@/lib/db/schema";
import { Container } from "@/components/ui/container";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UploadVideoForm } from "@/components/video/upload-video-form";

export const metadata: Metadata = { title: "Upload", robots: { index: false } };

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [creator] = await db
    .select({ id: creators.id })
    .from(creators)
    .where(eq(creators.userId, session.user.id))
    .limit(1);
  if (!creator) redirect("/studio");

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-md">
          <h1 className="font-display text-2xl font-bold mb-6">Upload a video</h1>
          <UploadVideoForm />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
