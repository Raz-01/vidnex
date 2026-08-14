import { Container } from "@/components/ui/container";

export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <Container className="py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-faint">
        <span>© {new Date().getFullYear()} vidnex</span>
        <span>Tokens are an in-app ledger, not a financial product.</span>
      </Container>
    </footer>
  );
}
