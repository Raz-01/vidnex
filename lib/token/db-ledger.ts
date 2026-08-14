import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { tokenLedgerEntries, type NewTokenLedgerEntry } from "@/lib/db/schema";
import type {
  LedgerAccount,
  LedgerTransfer,
  LedgerTransferResult,
  TokenLedger,
} from "./types";

const POSTGRES_UNIQUE_VIOLATION = "23505";

function accountFilter(account: LedgerAccount) {
  return account.id === null
    ? and(eq(tokenLedgerEntries.accountType, account.type), isNull(tokenLedgerEntries.accountId))
    : and(eq(tokenLedgerEntries.accountType, account.type), eq(tokenLedgerEntries.accountId, account.id));
}

/**
 * Postgres-backed implementation of {@link TokenLedger}. See
 * lib/token/types.ts for why every token-touching code path should depend
 * on the interface, not this class, directly.
 */
export class DbTokenLedger implements TokenLedger {
  async transfer(transfer: LedgerTransfer): Promise<LedgerTransferResult> {
    const total = transfer.legs.reduce((sum, leg) => sum + leg.amount, 0);
    if (total !== 0) {
      throw new Error(
        `TokenLedger.transfer: legs must sum to zero (got ${total}). Every spend must land somewhere.`,
      );
    }
    if (transfer.legs.length === 0) {
      throw new Error("TokenLedger.transfer: at least one leg is required.");
    }

    const firstLegKey = `${transfer.idempotencyKey}:0`;
    const existing = await this.#findByIdempotencyKey(firstLegKey);
    if (existing) {
      return this.#alreadyAppliedResult(existing.transferId);
    }

    const transferId = randomUUID();
    const rows: NewTokenLedgerEntry[] = transfer.legs.map((leg, i) => ({
      transferId,
      accountType: leg.account.type,
      accountId: leg.account.id,
      entryType: leg.entryType,
      amount: leg.amount,
      relatedUserId: leg.relatedUserId ?? null,
      relatedCreatorId: leg.relatedCreatorId ?? null,
      relatedVideoId: leg.relatedVideoId ?? null,
      metadata: leg.metadata ?? {},
      idempotencyKey: `${transfer.idempotencyKey}:${i}`,
    }));

    try {
      const entries = await db.transaction(async (tx) => tx.insert(tokenLedgerEntries).values(rows).returning());
      return { transferId, alreadyApplied: false, entries };
    } catch (err) {
      // Lost a race with a concurrent identical call — treat as a replay.
      if (isUniqueViolation(err)) {
        const raced = await this.#findByIdempotencyKey(firstLegKey);
        if (raced) return this.#alreadyAppliedResult(raced.transferId);
      }
      throw err;
    }
  }

  async getBalance(account: LedgerAccount): Promise<number> {
    const [row] = await db
      .select({ balance: sql<string>`coalesce(sum(${tokenLedgerEntries.amount}), 0)` })
      .from(tokenLedgerEntries)
      .where(accountFilter(account));
    return Number(row?.balance ?? 0);
  }

  async listEntries(account: LedgerAccount, opts?: { limit?: number; before?: Date }) {
    const conditions = [accountFilter(account)];
    if (opts?.before) conditions.push(lt(tokenLedgerEntries.createdAt, opts.before));

    return db
      .select()
      .from(tokenLedgerEntries)
      .where(and(...conditions))
      .orderBy(desc(tokenLedgerEntries.createdAt))
      .limit(opts?.limit ?? 50);
  }

  async #findByIdempotencyKey(idempotencyKey: string) {
    const [row] = await db
      .select()
      .from(tokenLedgerEntries)
      .where(eq(tokenLedgerEntries.idempotencyKey, idempotencyKey))
      .limit(1);
    return row;
  }

  async #alreadyAppliedResult(transferId: string): Promise<LedgerTransferResult> {
    const entries = await db
      .select()
      .from(tokenLedgerEntries)
      .where(eq(tokenLedgerEntries.transferId, transferId));
    return { transferId, alreadyApplied: true, entries };
  }
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && err.code === POSTGRES_UNIQUE_VIOLATION;
}

export const tokenLedger: TokenLedger = new DbTokenLedger();
