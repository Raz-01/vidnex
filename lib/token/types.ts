import type { TokenLedgerEntry } from "@/lib/db/schema";

export type LedgerAccountType = "user" | "creator" | "treasury" | "void";

export type LedgerEntryType = TokenLedgerEntry["entryType"];

export interface LedgerAccount {
  type: LedgerAccountType;
  /** Null only for the singleton treasury/void accounts. */
  id: string | null;
}

/** The singleton account earn is minted from and burns/cash-outs land in. */
export const VOID_ACCOUNT: LedgerAccount = { type: "void", id: null };

/** One leg of a transfer - a single debit or credit row. */
export interface LedgerLeg {
  account: LedgerAccount;
  entryType: LedgerEntryType;
  /** Integer token units. Positive = credit, negative = debit. */
  amount: number;
  relatedUserId?: string;
  relatedCreatorId?: string;
  relatedVideoId?: string;
  metadata?: Record<string, unknown>;
}

/** A balanced set of legs written atomically under one transferId. */
export interface LedgerTransfer {
  /** Caller-supplied, unique per logical action (safe to retry). */
  idempotencyKey: string;
  legs: LedgerLeg[];
}

export interface LedgerTransferResult {
  transferId: string;
  /** True if this idempotencyKey had already been applied (no-op replay). */
  alreadyApplied: boolean;
  entries: TokenLedgerEntry[];
}

/**
 * The internal-ledger token interface (DECISION 0 in CLAUDE.md). Every
 * spend/earn code path in the app talks to tokens ONLY through this
 * interface - never directly to the `token_ledger_entries` table - so a
 * real on-chain settlement layer (M5) can implement the same interface
 * without touching call sites.
 *
 * M0 ships the accounting primitives (transfer, balance, history). The
 * four spend utilities (Support/Access/Boost/Membership) and the
 * capped/diminishing Earn policy are business rules built on top of these
 * primitives in M3 - see lib/token/README.md.
 */
export interface TokenLedger {
  /** Write a balanced transfer. Legs' amounts MUST sum to zero. */
  transfer(transfer: LedgerTransfer): Promise<LedgerTransferResult>;

  /** Current balance for an account, derived from summing ledger entries. */
  getBalance(account: LedgerAccount): Promise<number>;

  /** Paginated history for an account, newest first. */
  listEntries(
    account: LedgerAccount,
    opts?: { limit?: number; before?: Date },
  ): Promise<TokenLedgerEntry[]>;
}
