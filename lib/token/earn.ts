import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tokenLedgerEntries } from "@/lib/db/schema";
import { tokenLedger } from "./db-ledger";
import { VOID_ACCOUNT } from "./types";
import { EARN_POLICY } from "./policy";

/**
 * Pure decay curve - no I/O, so it's directly unit-testable. `claimIndex`
 * is 0-based (0 = the user's first-ever claim). Capped/diminishing per
 * CLAUDE.md: "1st meaningful action earns; the 500th earns ~nothing."
 */
export function computeEarnAmount(claimIndex: number): number {
  if (claimIndex < 0 || claimIndex >= EARN_POLICY.maxLifetimeClaims) return 0;
  const decayed = EARN_POLICY.baseAmount * EARN_POLICY.decayPerClaim ** claimIndex;
  return Math.max(EARN_POLICY.minPayout, Math.round(decayed));
}

export interface EarnStatus {
  claimCount: number;
  nextAmount: number;
  canClaim: boolean;
  balance: number;
}

export async function getEarnStatus(userId: string): Promise<EarnStatus> {
  const [{ claimCount }] = await db
    .select({ claimCount: count() })
    .from(tokenLedgerEntries)
    .where(
      and(
        eq(tokenLedgerEntries.accountType, "user"),
        eq(tokenLedgerEntries.accountId, userId),
        eq(tokenLedgerEntries.entryType, "earn"),
      ),
    );

  const nextAmount = computeEarnAmount(claimCount);
  const balance = await tokenLedger.getBalance({ type: "user", id: userId });

  return { claimCount, nextAmount, canClaim: nextAmount > 0, balance };
}

/**
 * Human-gated per CLAUDE.md ("one human = one earner"). MVP proxy: verified
 * email at sign-in (see lib/auth/config.ts) - conservative and weak
 * against one person running multiple accounts, but a real uniqueness
 * check is out of scope for the MVP. TODO(anti-abuse): revisit before any
 * real earn-rate increase.
 */
export async function claimReward(userId: string, isVerifiedHuman: boolean): Promise<{ amount: number }> {
  if (!isVerifiedHuman) throw new Error("not_verified_human");

  const status = await getEarnStatus(userId);
  if (!status.canClaim) return { amount: 0 };

  // Keyed on claimCount, not a fresh random id: two concurrent claims that
  // both read the same count collide on this key, so the loser is treated
  // as a safe no-op replay instead of double-granting.
  await tokenLedger.transfer({
    idempotencyKey: `earn:${userId}:${status.claimCount}`,
    legs: [
      { account: VOID_ACCOUNT, entryType: "earn_emission", amount: -status.nextAmount },
      {
        account: { type: "user", id: userId },
        entryType: "earn",
        amount: status.nextAmount,
        metadata: { claimIndex: status.claimCount },
      },
    ],
  });

  return { amount: status.nextAmount };
}
