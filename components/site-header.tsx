import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { LinkButton } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-border-subtle">
      <Container className="flex h-20 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex items-center gap-3">
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
        </nav>
      </Container>
    </header>
  );
}
