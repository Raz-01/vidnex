import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { joinCreatorWaitlist } from "@/lib/waitlist/actions";

export const metadata: Metadata = {
  title: "For creators",
  description:
    "Bring your most engaged fans somewhere they can actually support you. Join the vidnex creator waitlist.",
};

const REASONS = [
  {
    title: "Keep your home base",
    copy: "You don't leave TikTok or Instagram. Link them here and funnel your most engaged fans in.",
  },
  {
    title: "Get paid four ways",
    copy: "Tips, exclusive unlocks, boosted discovery, and recurring memberships - all direct from fans to you.",
  },
  {
    title: "Real people, not bots",
    copy: "Creator-side verification and diminishing-returns economics mean the support you see is real.",
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Please check your details - name, email, and a link to your page are all required.",
  rate_limited: "Too many submissions from this connection - try again in a few minutes.",
};

export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid) : null;

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-flame opacity-20 blur-[120px]"
          />
          <Container className="relative py-20 sm:py-28">
            <div className="max-w-2xl">
              <Badge tone="brand" className="mb-6">
                Creator waitlist · Afrobeats launch
              </Badge>
              <h1 className="font-display text-3xl sm:text-5xl font-bold leading-[1.1] tracking-tight">
                Turn your most engaged fans into a <span className="text-flame">real income</span>
              </h1>
              <p className="mt-6 text-lg text-ink-muted leading-relaxed">
                vidnex is a digital home for African entertainment, built around
                creator-fan relationships instead of an algorithm feed. We&rsquo;re
                onboarding a first wave of creators by hand - tell us about yourself below.
              </p>
            </div>

            <div className="mt-16 grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
              <div className="grid gap-6">
                {REASONS.map((r) => (
                  <Card key={r.title}>
                    <h3 className="font-display font-bold">{r.title}</h3>
                    <p className="mt-2 text-sm text-ink-muted leading-relaxed">{r.copy}</p>
                  </Card>
                ))}
              </div>

              <Card>
                <h2 className="font-display text-xl font-bold">Register your interest</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Free, no commitment. We&rsquo;ll reach out as we open up onboarding.
                </p>

                {errorMessage && (
                  <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                    {errorMessage}
                  </p>
                )}

                <form action={joinCreatorWaitlist} className="mt-6 grid gap-4">
                  <div className="grid gap-1.5">
                    <label htmlFor="name" className="text-sm font-medium text-ink-muted">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      maxLength={120}
                      placeholder="Your name or stage name"
                      className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-ink-muted">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      maxLength={255}
                      placeholder="you@email.com"
                      autoComplete="email"
                      className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="primaryLink" className="text-sm font-medium text-ink-muted">
                      Your page (TikTok, IG, YouTube - wherever fans find you)
                    </label>
                    <input
                      id="primaryLink"
                      name="primaryLink"
                      required
                      maxLength={200}
                      placeholder="tiktok.com/@yourname"
                      className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="note" className="text-sm font-medium text-ink-muted">
                      Anything else? <span className="text-ink-faint">(optional)</span>
                    </label>
                    <textarea
                      id="note"
                      name="note"
                      maxLength={500}
                      rows={3}
                      placeholder="What you create, your scene, follower range..."
                      className="rounded-xl border border-border bg-canvas px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral resize-none"
                    />
                  </div>
                  <Button type="submit" size="lg" className="mt-2">
                    Join the waitlist
                  </Button>
                </form>
              </Card>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
