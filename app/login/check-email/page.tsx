import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";

export default function CheckEmailPage() {
  return (
    <main className="flex-1 flex items-center justify-center py-16">
      <Container className="max-w-sm text-center">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <Card>
          <h1 className="font-display text-xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            We sent you a sign-in link. Open it on this device to finish signing in to vidnex.
          </p>
        </Card>
      </Container>
    </main>
  );
}
