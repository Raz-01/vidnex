import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "You're on the list",
  robots: { index: false },
};

export default function CreatorsThanksPage() {
  return (
    <>
      <main className="flex-1 flex items-center justify-center py-16">
        <Container className="max-w-sm text-center">
          <div className="flex justify-center mb-8">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          <Card>
            <h1 className="font-display text-xl font-bold">You&rsquo;re on the list 🎉</h1>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              We review every creator by hand for the Afrobeats launch. We&rsquo;ll email you as
              soon as onboarding opens up.
            </p>
            <LinkButton href="/" size="md" variant="secondary" className="mt-6 w-full">
              Back to vidnex
            </LinkButton>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
