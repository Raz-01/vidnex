import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { getEarnStatus } from "@/lib/token/earn";
import { claimEarnReward } from "@/lib/token/actions";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Rewards", robots: { index: false } };

const ERROR_MESSAGES: Record<string, string> = {
  not_verified: "We couldn't verify your account yet - try signing out and back in.",
};

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string; error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { claimed, error } = await searchParams;
  const status = await getEarnStatus(session.user.id);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 py-16">
        <Container className="max-w-md">
          <h1 className="font-display text-2xl font-bold">Rewards</h1>
          <p className="mt-2 text-ink-muted">
            A small, diminishing bonus for showing up - never a flat pay-per-watch. The more
            you&rsquo;ve claimed, the smaller the next one gets.
          </p>

          {claimed && (
            <p className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
              You earned <strong className="text-token">{claimed}</strong> tokens.
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {ERROR_MESSAGES[error] ?? "Something went wrong - try again."}
            </p>
          )}

          <Card className="mt-6 text-center">
            <p className="text-sm text-ink-muted">Your balance</p>
            <p className="mt-1 font-display text-4xl font-bold text-token">{status.balance}</p>

            <div className="mt-8">
              {status.canClaim ? (
                <form action={claimEarnReward}>
                  <Button type="submit" variant="token" size="lg" className="w-full">
                    Claim {status.nextAmount} tokens
                  </Button>
                </form>
              ) : (
                <p className="text-sm text-ink-faint">
                  You&rsquo;ve claimed the maximum {status.claimCount} times - nothing left to
                  earn here. Support, Access, Boost, and Membership are still all in front of
                  you.
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-ink-faint">Claimed {status.claimCount} times so far</p>
          </Card>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
