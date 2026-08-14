import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { tokenLedger } from "@/lib/token/db-ledger";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const balance = await tokenLedger.getBalance({ type: "user", id: session.user.id });

  return (
    <main className="flex-1 flex items-center justify-center py-16">
      <Container className="max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <Card>
          <div className="flex items-center gap-4">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-12 w-12 rounded-full border border-border"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-flame" />
            )}
            <div>
              <p className="font-semibold">{session.user.name ?? "vidnex user"}</p>
              <p className="text-sm text-ink-muted">{session.user.email}</p>
            </div>
          </div>

          <Link
            href="/rewards"
            className="mt-6 flex items-center justify-between rounded-xl bg-canvas-overlay px-4 py-3 hover:bg-canvas-raised transition-colors"
          >
            <span className="text-sm text-ink-muted">Token balance</span>
            <Badge tone="token">{balance}</Badge>
          </Link>

          <LinkButton href="/studio" variant="secondary" className="mt-3 w-full">
            Creator studio
          </LinkButton>

          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="secondary" className="w-full">
              Sign out
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
