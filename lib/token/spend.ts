import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { accessUnlocks, creators, memberships, videos } from "@/lib/db/schema";
import { tokenLedger } from "./db-ledger";
import { VOID_ACCOUNT } from "./types";
import { BOOST_POLICY, MEMBERSHIP_POLICY } from "./policy";

/**
 * The four spend utilities from CLAUDE.md - Support, Access, Boost,
 * Membership - plus a creator's simulated cash-out. Each is a thin
 * business-rule layer over tokenLedger.transfer(): validate, check
 * balance, write a balanced transfer, then update whatever non-ledger
 * state the action implies (an unlock row, a membership row, boostScore).
 *
 * Known limitation: the balance check and the transfer write are two
 * separate steps, not one atomic operation - see lib/token/README.md.
 */

async function requireBalance(account: { type: "user" | "creator"; id: string }, amount: number) {
  const balance = await tokenLedger.getBalance(account);
  if (balance < amount) throw new Error("insufficient_balance");
}

export async function supportCreator(opts: {
  userId: string;
  creatorId: string;
  videoId?: string;
  amount: number;
}) {
  const { userId, creatorId, videoId, amount } = opts;
  await requireBalance({ type: "user", id: userId }, amount);

  return tokenLedger.transfer({
    idempotencyKey: `support:${randomUUID()}`,
    legs: [
      {
        account: { type: "user", id: userId },
        entryType: "support_out",
        amount: -amount,
        relatedCreatorId: creatorId,
        relatedVideoId: videoId,
      },
      {
        account: { type: "creator", id: creatorId },
        entryType: "support_in",
        amount,
        relatedUserId: userId,
        relatedVideoId: videoId,
      },
    ],
  });
}

export async function unlockAccess(opts: { userId: string; videoId: string }) {
  const { userId, videoId } = opts;

  const [video] = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!video) throw new Error("not_found");
  if (!video.isExclusive || !video.accessPriceTokens) throw new Error("not_exclusive");

  const [existing] = await db
    .select({ userId: accessUnlocks.userId })
    .from(accessUnlocks)
    .where(and(eq(accessUnlocks.userId, userId), eq(accessUnlocks.videoId, videoId)))
    .limit(1);
  if (existing) return { alreadyUnlocked: true };

  const price = video.accessPriceTokens;
  await requireBalance({ type: "user", id: userId }, price);

  await tokenLedger.transfer({
    idempotencyKey: `access:${randomUUID()}`,
    legs: [
      {
        account: { type: "user", id: userId },
        entryType: "access_out",
        amount: -price,
        relatedVideoId: videoId,
        relatedCreatorId: video.creatorId,
      },
      { account: VOID_ACCOUNT, entryType: "access_burn", amount: price, relatedVideoId: videoId },
    ],
  });

  await db.insert(accessUnlocks).values({ userId, videoId }).onConflictDoNothing();
  return { alreadyUnlocked: false };
}

export async function boostVideo(opts: { userId: string; videoId: string; creatorId: string; amount: number }) {
  const { userId, videoId, creatorId, amount } = opts;
  await requireBalance({ type: "user", id: userId }, amount);

  const creatorShare = Math.round(amount * BOOST_POLICY.creatorShare);
  const treasuryShare = amount - creatorShare; // guarantees exact integer balance

  await tokenLedger.transfer({
    idempotencyKey: `boost:${randomUUID()}`,
    legs: [
      {
        account: { type: "user", id: userId },
        entryType: "boost_out",
        amount: -amount,
        relatedVideoId: videoId,
        relatedCreatorId: creatorId,
      },
      {
        account: { type: "creator", id: creatorId },
        entryType: "boost_creator_in",
        amount: creatorShare,
        relatedUserId: userId,
        relatedVideoId: videoId,
      },
      {
        account: { type: "treasury", id: null },
        entryType: "boost_treasury_in",
        amount: treasuryShare,
        relatedUserId: userId,
        relatedVideoId: videoId,
      },
    ],
  });

  // Bounded, diminishing-returns discovery signal - sqrt, not linear, so
  // spending 25x more only doubles the bump (CLAUDE.md: not "tokens =
  // guaranteed reach"). Best-effort counter, not part of the financial
  // ledger - see the module comment on atomicity.
  const scoreIncrement = Math.round(BOOST_POLICY.scoreScale * Math.sqrt(amount));
  await db
    .update(videos)
    .set({ boostScore: sql`${videos.boostScore} + ${scoreIncrement}`, updatedAt: new Date() })
    .where(eq(videos.id, videoId));

  return { creatorShare, treasuryShare, scoreIncrement };
}

export async function subscribeMembership(opts: { userId: string; creatorId: string }) {
  const { userId, creatorId } = opts;

  const [creator] = await db.select().from(creators).where(eq(creators.id, creatorId)).limit(1);
  if (!creator) throw new Error("not_found");
  if (!creator.membershipPriceTokens) throw new Error("membership_not_offered");

  const [existing] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.creatorId, creatorId), eq(memberships.status, "active")),
    )
    .limit(1);
  if (existing) throw new Error("already_member");

  const price = creator.membershipPriceTokens;
  await requireBalance({ type: "user", id: userId }, price);

  await tokenLedger.transfer({
    idempotencyKey: `membership:${randomUUID()}`,
    legs: [
      { account: { type: "user", id: userId }, entryType: "membership_out", amount: -price, relatedCreatorId: creatorId },
      { account: { type: "creator", id: creatorId }, entryType: "membership_in", amount: price, relatedUserId: userId },
    ],
  });

  const periodEnd = new Date(Date.now() + MEMBERSHIP_POLICY.periodDays * 24 * 60 * 60 * 1000);
  await db.insert(memberships).values({
    userId,
    creatorId,
    status: "active",
    tokensPerPeriod: price,
    periodStart: new Date(),
    periodEnd,
  });
}

export async function cancelMembership(opts: { userId: string; creatorId: string }) {
  const { userId, creatorId } = opts;
  await db
    .update(memberships)
    .set({ status: "canceled", canceledAt: new Date() })
    .where(
      and(eq(memberships.userId, userId), eq(memberships.creatorId, creatorId), eq(memberships.status, "active")),
    );
}

/**
 * Simulated/manual cash-out (DECISION 0 - no real payout in the MVP).
 * `requestedByUserId` must own `creatorId`; enforced here, not just at the
 * call site, since this moves real ledger balance.
 */
export async function simulateCashout(opts: { creatorId: string; requestedByUserId: string; amount: number }) {
  const { creatorId, requestedByUserId, amount } = opts;
  if (amount <= 0) throw new Error("invalid_amount");

  const [creator] = await db.select().from(creators).where(eq(creators.id, creatorId)).limit(1);
  if (!creator || creator.userId !== requestedByUserId) throw new Error("forbidden");

  await requireBalance({ type: "creator", id: creatorId }, amount);

  await tokenLedger.transfer({
    idempotencyKey: `cashout:${randomUUID()}`,
    legs: [
      { account: { type: "creator", id: creatorId }, entryType: "cashout_simulated", amount: -amount },
      { account: VOID_ACCOUNT, entryType: "cashout_simulated", amount },
    ],
  });
}
