import { pgTable, text, timestamp, uuid, integer, pgEnum, jsonb, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * The token ledger - an internal, append-only accounting log (DECISION 0 in
 * CLAUDE.md: an internal ledger for the MVP, not an on-chain asset). This
 * table is the single source of truth for token movement; any balance
 * shown elsewhere (e.g. creators.tokenBalance) is a cache derived from it.
 *
 * Every action (earn, support, access, boost, membership, simulated
 * cash-out) writes one or more balanced rows sharing a `transferId`, e.g. a
 * support tip writes a debit row on the sender's user account and a credit
 * row on the recipient's creator account. This keeps the ledger auditable
 * and makes `TokenLedger` (lib/token) swappable for a real on-chain
 * settlement layer later without changing this shape.
 */

export const ledgerAccountTypeEnum = pgEnum("ledger_account_type", [
  "user", // a spender's wallet
  "creator", // a creator's earnings balance
  "treasury", // discovery treasury (Boost's non-creator split)
  "void", // outside the ledger entirely - where earn is minted from and burns/cash-outs go
]);

export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "earn", // capped/diminishing participation reward (credit user)
  "earn_emission", // matching mint for an earn payout (debit void)
  "support_out", // user tips a creator (debit user)
  "support_in", // creator receives a tip (credit creator)
  "access_out", // user unlocks exclusive content (debit user)
  "access_burn", // matching burn of an access spend (credit void - removed from circulation)
  "boost_out", // user spends to boost a video (debit user)
  "boost_creator_in", // creator's share of a boost (credit creator)
  "boost_treasury_in", // discovery treasury's share of a boost (credit treasury)
  "membership_out", // user pays a recurring membership (debit user)
  "membership_in", // creator receives membership revenue (credit creator)
  "cashout_simulated", // creator "cashes out" - simulated/manual, clearly labelled, no real payout (credit void)
  "adjustment", // manual/admin correction, always requires a note
]);

export const tokenLedgerEntries = pgTable(
  "token_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Groups the balanced rows produced by one logical action.
    transferId: uuid("transfer_id").notNull(),

    accountType: ledgerAccountTypeEnum("account_type").notNull(),
    // Null only for the singleton treasury/void accounts.
    accountId: uuid("account_id"),

    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    // Integer token units. Positive = credit, negative = debit. Never a float.
    amount: integer("amount").notNull(),

    // Counterparties / related rows, for display and audit - all optional.
    relatedUserId: uuid("related_user_id"),
    relatedCreatorId: uuid("related_creator_id"),
    relatedVideoId: uuid("related_video_id"),

    // Free-form context (e.g. earn reason, admin note for adjustments).
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    // Caller-supplied key so retries of the same logical action never
    // double-write. Enforced unique below.
    idempotencyKey: text("idempotency_key").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("token_ledger_idempotency_key_idx").on(t.idempotencyKey)],
);

export type TokenLedgerEntry = typeof tokenLedgerEntries.$inferSelect;
export type NewTokenLedgerEntry = typeof tokenLedgerEntries.$inferInsert;
