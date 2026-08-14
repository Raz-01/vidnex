/**
 * Provisional MVP token policy. These numbers exist so the Earn/spend
 * mechanics are demoable end to end - they are NOT final tokenomics.
 * CLAUDE.md's non-goals are explicit that finalized supply/emissions
 * numbers come from economic modelling, not code. Treat every constant
 * here as a placeholder pending that modelling.
 */

export const EARN_POLICY = {
  /** Tokens paid out on a user's very first claim. */
  baseAmount: 100,
  /** Multiplicative decay applied per prior claim - this is the "diminishing" curve. */
  decayPerClaim: 0.985,
  /** Once the decayed amount rounds to 0, claiming stops being worth calling. */
  minPayout: 0,
  /** Hard backstop regardless of the curve - "the 500th earns ~nothing" from CLAUDE.md. */
  maxLifetimeClaims: 500,
} as const;

/** Preset Support (tip) amounts - no free-form amount in the MVP UI. */
export const SUPPORT_PRESETS = [10, 50, 200] as const;

/** Preset Boost spend amounts - no free-form amount in the MVP UI. */
export const BOOST_PRESETS = [20, 100, 500] as const;

export const BOOST_POLICY = {
  /** Share of a boost that lands in the creator's balance; the rest goes to the discovery treasury. */
  creatorShare: 0.7,
  /**
   * boostScore increment is sqrt(amount) scaled by this constant, not
   * amount itself - bounded, diminishing-returns discovery per CLAUDE.md
   * ("NOT tokens = guaranteed reach"). Spending 25x more only doubles the
   * score bump.
   */
  scoreScale: 10,
} as const;

export const MEMBERSHIP_POLICY = {
  /** Fixed period length for the MVP - no partial months, no proration. */
  periodDays: 30,
} as const;
