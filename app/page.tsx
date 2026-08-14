import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "vidnex - the digital home for entertainment culture",
  description:
    "Short-form video, real creator relationships, and one in-app token. Launching with Afrobeats · Nigeria.",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Arrive with a video",
    copy: "Short-form video is the door in - the same clips already moving on TikTok and Instagram, now with a home.",
  },
  {
    step: "02",
    title: "Stay for the relationship",
    copy: "Creator pages, memberships, direct support - the parasocial connection an algorithm feed can't give you.",
  },
  {
    step: "03",
    title: "Move value with one token",
    copy: "Tip, unlock, boost, subscribe - all in one balance, all inside vidnex, never a speculative asset.",
  },
];

const UTILITIES = [
  {
    name: "Support",
    tone: "brand" as const,
    copy: "Tip a creator mid-scroll. It lands straight in their balance.",
  },
  {
    name: "Access",
    tone: "brand" as const,
    copy: "Unlock a drop before anyone else - exclusive cuts, early releases.",
  },
  {
    name: "Boost",
    tone: "token" as const,
    copy: "Put weight behind a video's discovery. Bounded, never pay-to-win.",
  },
  {
    name: "Membership",
    tone: "success" as const,
    copy: "Join a creator's fan club. Recurring, direct, no middleman.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-flame opacity-20 blur-[120px]"
          />
          <Container className="relative py-24 sm:py-32 text-center">
            <Badge tone="brand" className="mb-6">
              Launching with Afrobeats · Nigeria
            </Badge>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight max-w-3xl mx-auto">
              The digital home for <span className="text-flame">entertainment culture</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-ink-muted max-w-2xl mx-auto leading-relaxed">
              Short-form video is how people arrive. Real creator relationships are why they
              stay. One token is how value moves. We don&rsquo;t ask anyone to leave TikTok or
              Instagram - creators bring their most engaged fans here.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <LinkButton href="/creators" size="lg">
                I&rsquo;m a creator
              </LinkButton>
              <LinkButton href="/login" size="lg" variant="secondary">
                I&rsquo;m a fan
              </LinkButton>
            </div>
          </Container>
        </section>

        <section className="border-t border-border-subtle">
          <Container className="py-20">
            <div className="grid sm:grid-cols-3 gap-8">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.step}>
                  <span className="font-display text-sm font-bold text-magenta">{s.step}</span>
                  <h3 className="mt-2 font-display text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-ink-muted leading-relaxed">{s.copy}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-border-subtle bg-canvas-raised/40">
          <Container className="py-20">
            <div className="text-center max-w-xl mx-auto mb-12">
              <h2 className="font-display text-2xl sm:text-3xl font-bold">
                Free social, always. <span className="text-token">Token</span> for more.
              </h2>
              <p className="mt-3 text-ink-muted">
                Watch, like, comment, follow, share - never costs a token. It only enters when a
                fan wants to go further.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {UTILITIES.map((u) => (
                <Card key={u.name} className="flex items-start gap-4">
                  <Badge tone={u.tone} className="shrink-0 mt-1">
                    {u.name}
                  </Badge>
                  <p className="text-ink-muted leading-relaxed">{u.copy}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-border-subtle">
          <Container className="py-20">
            <div className="rounded-2xl bg-flame p-10 sm:p-14 text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Already own an audience on TikTok or IG?
              </h2>
              <p className="mt-3 text-white/90 max-w-xl mx-auto">
                Bring your most engaged fans somewhere they can actually support you. Register
                your interest - we&rsquo;re onboarding creators for the Afrobeats launch now.
              </p>
              <LinkButton href="/creators" size="lg" variant="secondary" className="mt-8">
                Join the creator waitlist
              </LinkButton>
            </div>
          </Container>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
