import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { tokenLedger } from "@/lib/token/db-ledger";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export async function SiteHeader() {
  const session = await auth();
  const balance = session?.user ? await tokenLedger.getBalance({ type: "user", id: session.user.id }) : null;

  return (
    <header className="border-b border-border-subtle">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/feed"
            className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink transition-colors"
          >
            Feed
          </Link>
          {session?.user ? (
            <>
              <Link
                href="/studio"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink transition-colors"
              >
                Studio
              </Link>
              <Link href="/rewards" className="transition-opacity hover:opacity-80">
                <Badge tone="token">{balance} tokens</Badge>
              </Link>
              <Link href="/account">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-9 w-9 rounded-full border border-border"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-flame" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/creators"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink transition-colors"
              >
                For creators
              </Link>
              <Link
                href="/login"
                className="hidden sm:inline text-sm font-medium text-ink-muted hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <LinkButton href="/creators" size="sm">
                Join the waitlist
              </LinkButton>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}
