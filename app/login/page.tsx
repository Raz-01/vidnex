import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/lib/auth/config";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/account");

  return (
    <main className="flex-1 flex items-center justify-center py-16">
      <Container className="max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <Card>
          <h1 className="font-display text-xl font-bold text-center">Sign in to vidnex</h1>
          <p className="mt-1 text-sm text-ink-muted text-center">
            Free to join. No wallet, no card required.
          </p>

          <form
            className="mt-6"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/account" });
            }}
          >
            <Button type="submit" variant="secondary" className="w-full">
              Continue with Google
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-faint">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <form
            className="flex flex-col gap-3"
            action={async (formData) => {
              "use server";
              await signIn("resend", { email: formData.get("email"), redirectTo: "/account" });
            }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="you@email.com"
              autoComplete="email"
              className="h-11 rounded-full border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
            />
            <Button type="submit" className="w-full">
              Continue with email
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
