import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/**
 * Gate for every /admin page. There is no in-app way to become an admin
 * (see users.isAdmin's comment and scripts/promote-admin.mjs) - this just
 * checks the flag and bounces anyone who doesn't have it.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user] = await db
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.isAdmin) redirect("/");

  return session.user;
}
