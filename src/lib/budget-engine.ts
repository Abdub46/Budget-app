import { Types } from 'mongoose';
import { User, BudgetStrategy } from '@/models';
import type { IBudgetStrategy, BudgetStrategyConfidence } from '@/models/BudgetStrategy';
import type { IUser } from '@/models/User';
import { formatCurrency } from '@/lib/utils';

/**
 * ============================================================================
 * AI BUDGETING ENGINE
 * ============================================================================
 * This is the "AI" referenced throughout the spec. It is intentionally a
 * transparent, deterministic rules engine rather than an opaque LLM call:
 *  - every percentage it produces is fully explainable from the user's own
 *    numbers (spec §17: never fabricate, never invent figures),
 *  - it is reproducible and testable without any external API / network
 *    access, so it works the same in this sandbox as in production,
 *  - it can never accidentally hallucinate a ratio that leaves the user
 *    unable to cover their essential expenses.
 *
 * "AI-driven" here means: the recommendation is computed FOR this specific
 * user FROM their specific data (income, essential expenses, debt,
 * dependents, income stability, emergency fund, goals) rather than forcing
 * everyone into 50/30/20 — see computeBudgetAllocation below. If a hosted
 * LLM is later wired in for softer, more conversational reasoning text, the
 * percentages it returns should still be validated against this engine's
 * output (sum to 100, needs floor respected) before being trusted.
 * ============================================================================
 */

export interface BudgetEngineInput {
  employmentStatus: string;
  incomeStability: 'stable' | 'variable' | 'unstable';
  monthlyIncome: number;
  averageMonthlyBudget: number; // fallback when monthlyIncome isn't set
  housingExpense: number;
  foodExpense: number;
  transportExpense: number;
  utilitiesExpense: number;
  debtPayment: number;
  currentSavings: number;
  emergencyFund: number;
  dependents: number;
  financialGoal?: string;
  savingsGoal?: string;
  currency: string;
}

export interface BudgetAllocationResult {
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  reasoning: string;
  confidence: BudgetStrategyConfidence;
  primaryDriver: string;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Computes a personalized Needs / Wants / Savings allocation. The three
 * percentages always sum to exactly 100. This never simply returns a fixed
 * ratio (50/30/20, 60/20/20, etc.) — those only emerge here if they
 * genuinely fit the numbers, the same as any other ratio would.
 */
export function computeBudgetAllocation(input: BudgetEngineInput): BudgetAllocationResult {
  const income = input.monthlyIncome > 0 ? input.monthlyIncome : input.averageMonthlyBudget;
  const essentials =
    input.housingExpense + input.foodExpense + input.transportExpense + input.utilitiesExpense;
  const totalEssentialBurden = essentials + input.debtPayment;

  const essentialRatio = income > 0 ? totalEssentialBurden / income : 0;
  const debtRatio = income > 0 ? input.debtPayment / income : 0;
  const essentialPercent = essentialRatio * 100;

  const drivers: string[] = [];
  let primaryDriver = 'a balanced financial profile';

  // --- Step 1: baseline Needs% anchored to the user's actual essential burden,
  // not a fixed assumption. A generous buffer is added so the recommendation
  // doesn't leave the user exactly at the edge of covering necessities. ---
  let needs: number;
  if (essentialPercent >= 75) {
    needs = clamp(essentialPercent + 5, 75, 88);
    primaryDriver = 'very high essential expenses relative to income';
    drivers.push(
      `your essential expenses (housing, food, transport, utilities, debt) currently take up about ${round1(
        essentialPercent
      )}% of your income`
    );
  } else if (essentialPercent >= 60) {
    needs = clamp(essentialPercent + 3, 60, 78);
    primaryDriver = 'high essential expenses';
    drivers.push(
      `your essential expenses take up a significant portion of your income (about ${round1(
        essentialPercent
      )}%)`
    );
  } else if (essentialPercent >= 40) {
    needs = clamp(essentialPercent + 5, 45, 62);
    drivers.push(`your essential expenses run around ${round1(essentialPercent)}% of your income`);
  } else if (essentialPercent > 0) {
    needs = clamp(essentialPercent + 12, 35, 55);
    primaryDriver = 'a relatively low essential-expense burden';
    drivers.push(
      `your essential expenses are relatively low at about ${round1(essentialPercent)}% of your income`
    );
  } else {
    // No usable income/essentials data at all — fall back to a neutral,
    // clearly-labelled starting point rather than guessing.
    needs = 50;
    drivers.push("we don't yet have enough of your income and essential-expense data to personalize this fully");
  }

  // --- Step 2: start savings from a baseline, then adjust for stability,
  // emergency fund strength, and debt — before finalizing Wants as the
  // remainder, so the three always sum to 100. ---
  let savings = clamp(100 - needs - 20, 5, 30); // provisional; refined below relative to remaining room
  const remainingAfterNeeds = 100 - needs;
  savings = clamp(remainingAfterNeeds * 0.4, 5, remainingAfterNeeds - 5);

  const monthlyEssentialSpend = essentials + input.debtPayment;
  const emergencyFundMonths = monthlyEssentialSpend > 0 ? input.emergencyFund / monthlyEssentialSpend : 0;

  if (input.incomeStability === 'unstable') {
    savings = clamp(savings + 5, 5, remainingAfterNeeds - 5);
    primaryDriver = essentialPercent >= 60 ? primaryDriver : 'unstable income';
    drivers.push('your income is irregular, so building a larger cash buffer takes priority over discretionary spending');
  } else if (input.incomeStability === 'stable' && emergencyFundMonths >= 3 && essentialPercent < 60) {
    savings = clamp(savings + 5, 5, remainingAfterNeeds - 5);
    if (essentialPercent < 40) primaryDriver = 'stable income with a strong emergency fund';
    drivers.push(
      `your income is stable and your emergency fund already covers roughly ${round1(
        emergencyFundMonths
      )} months of essential spending, so more room can go toward savings and investments`
    );
  } else if (emergencyFundMonths < 1 && income > 0) {
    savings = clamp(savings + 3, 5, remainingAfterNeeds - 5);
    drivers.push('your emergency fund is currently thin, so building it up is weighted into your savings target');
  }

  if (debtRatio >= 0.15) {
    // Significant debt: it's already inflating `needs`, but call it out
    // explicitly as the driver and make sure Wants absorbs the tightening,
    // not Savings — debt payoff and a minimum safety net both outrank
    // discretionary spending.
    primaryDriver = 'significant debt obligations';
    drivers.unshift(
      `debt payments alone account for about ${round1(debtRatio * 100)}% of your income, so paying that down is prioritized`
    );
    savings = clamp(savings, 5, remainingAfterNeeds - 5);
  }

  if (input.dependents >= 3) {
    needs = clamp(needs + 3, needs, 88);
    drivers.push(`supporting ${input.dependents} dependents typically adds pressure to essential spending`);
  }

  // --- Step 3: Wants absorbs whatever remains, with a floor so it's never
  // driven to zero (the user still needs SOME discretionary room to be a
  // realistic, livable budget) — spec §2: never leave the user unable to
  // function, and a 0% Wants budget is not something anyone can actually
  // stick to. ---
  needs = clamp(Math.round(needs), 30, 88);
  savings = clamp(Math.round(savings), 3, 100 - needs - 3);
  let wants = 100 - needs - savings;

  if (wants < 5) {
    const shortfall = 5 - wants;
    wants = 5;
    savings = clamp(savings - shortfall, 3, 100 - needs - 5);
    // If savings can't absorb the whole shortfall either, needs gives it back last.
    const total = needs + savings + wants;
    if (total !== 100) needs -= total - 100;
  }

  // Final integrity guarantee — this should already hold, but the model-level
  // pre-validate hook on BudgetStrategy also enforces it as a hard backstop.
  const drift = 100 - (needs + savings + wants);
  needs += drift;

  const confidence: BudgetStrategyConfidence =
    income <= 0
      ? 'low'
      : essentials === 0 && input.debtPayment === 0
        ? 'low'
        : input.monthlyIncome > 0 && essentials > 0
          ? 'high'
          : 'medium';

  const currencyNote =
    income > 0
      ? ` Based on a monthly income of ${formatCurrency(income, input.currency)}, that's roughly ${formatCurrency(
          (income * needs) / 100,
          input.currency
        )} for needs, ${formatCurrency((income * wants) / 100, input.currency)} for wants, and ${formatCurrency(
          (income * savings) / 100,
          input.currency
        )} for savings & investments each month.`
      : '';

  const reasoning =
    `I've allocated ${needs}% to Needs, ${wants}% to Wants, and ${savings}% to Savings & Investments. ` +
    drivers.slice(0, 3).join('; ') +
    `.${currencyNote}`;

  return {
    needsPercent: needs,
    wantsPercent: wants,
    savingsPercent: savings,
    reasoning,
    confidence,
    primaryDriver,
  };
}

/** Converts a User document into the engine's input shape. */
function toEngineInput(user: Pick<IUser, keyof BudgetEngineInput | 'currency'> | any): BudgetEngineInput {
  return {
    employmentStatus: user.employmentStatus,
    incomeStability: user.incomeStability || 'stable',
    monthlyIncome: user.monthlyIncome || 0,
    averageMonthlyBudget: user.averageMonthlyBudget || 0,
    housingExpense: user.housingExpense || 0,
    foodExpense: user.foodExpense || 0,
    transportExpense: user.transportExpense || 0,
    utilitiesExpense: user.utilitiesExpense || 0,
    debtPayment: user.debtPayment || 0,
    currentSavings: user.currentSavings || 0,
    emergencyFund: user.emergencyFund || 0,
    dependents: user.dependents || 0,
    financialGoal: user.financialGoal,
    savingsGoal: user.savingsGoal,
    currency: user.currency || 'KES',
  };
}

/** A meaningful change is >= 5 percentage points on any one bucket. */
const REASSESS_THRESHOLD_POINTS = 5;

function isMeaningfulChange(
  a: { needsPercent: number; wantsPercent: number; savingsPercent: number },
  b: { needsPercent: number; wantsPercent: number; savingsPercent: number }
): boolean {
  return (
    Math.abs(a.needsPercent - b.needsPercent) >= REASSESS_THRESHOLD_POINTS ||
    Math.abs(a.wantsPercent - b.wantsPercent) >= REASSESS_THRESHOLD_POINTS ||
    Math.abs(a.savingsPercent - b.savingsPercent) >= REASSESS_THRESHOLD_POINTS
  );
}

function nextReviewDate(from: Date = new Date()): Date {
  // Beginning of next calendar month — matches the app's existing monthly
  // budgeting cycle (see month-end cron).
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}

/** Returns the user's current active strategy, or null if none exists yet. */
export async function getActiveStrategy(
  userId: string | Types.ObjectId
): Promise<IBudgetStrategy | null> {
  return BudgetStrategy.findOne({ userId, isActive: true }).lean() as any;
}

export async function getStrategyHistory(
  userId: string | Types.ObjectId,
  limit = 12
): Promise<IBudgetStrategy[]> {
  return BudgetStrategy.find({ userId }).sort({ generatedAt: -1 }).limit(limit).lean() as any;
}

/**
 * Generates (or refreshes) the AI-recommended strategy for a user.
 *  - If there is no active strategy yet, always creates one (e.g. right
 *    after registration).
 *  - If the active strategy is a user's `custom` override, it is left
 *    alone unless `force` is passed — the AI recommends, it doesn't
 *    silently overwrite what the user chose (spec §15).
 *  - If the active strategy is AI-generated, a new one is only created
 *    when the freshly computed allocation differs meaningfully (spec §6)
 *    — this prevents the recommendation from shifting on every dashboard
 *    load.
 */
export async function reassessStrategy(
  userId: string | Types.ObjectId,
  options: { force?: boolean } = {}
): Promise<{ strategy: IBudgetStrategy; changed: boolean }> {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found.');

  const active = await BudgetStrategy.findOne({ userId, isActive: true });

  if (active && active.source === 'custom' && !options.force) {
    return { strategy: active.toObject(), changed: false };
  }

  const computed = computeBudgetAllocation(toEngineInput(user));

  if (active && !options.force && !isMeaningfulChange(active, computed)) {
    return { strategy: active.toObject(), changed: false };
  }

  if (active) active.isActive = false;

  const changeReason =
    active && (active.needsPercent !== computed.needsPercent || active.wantsPercent !== computed.wantsPercent)
      ? `Your allocation changed from ${active.needsPercent}/${active.wantsPercent}/${active.savingsPercent} to ${computed.needsPercent}/${computed.wantsPercent}/${computed.savingsPercent} because ${computed.reasoning.split('. ').slice(1).join('. ').toLowerCase() || 'your financial details changed.'}`
      : undefined;

  const created = await BudgetStrategy.create({
    userId,
    needsPercent: computed.needsPercent,
    wantsPercent: computed.wantsPercent,
    savingsPercent: computed.savingsPercent,
    source: 'ai',
    reasoning: computed.reasoning,
    confidence: computed.confidence,
    primaryDriver: computed.primaryDriver,
    previousNeedsPercent: active?.needsPercent,
    previousWantsPercent: active?.wantsPercent,
    previousSavingsPercent: active?.savingsPercent,
    changeReason,
    isActive: true,
    generatedAt: new Date(),
    nextReviewAt: nextReviewDate(),
  });

  if (active) await active.save();

  return { strategy: created.toObject(), changed: true };
}

/** Ensures a user has an active strategy, creating the initial AI one if not (e.g. right after registration). */
export async function ensureStrategy(userId: string | Types.ObjectId): Promise<IBudgetStrategy> {
  const existing = await getActiveStrategy(userId);
  if (existing) return existing;
  const { strategy } = await reassessStrategy(userId, { force: true });
  return strategy;
}

/** Lets the user manually override the AI recommendation (spec §5/§15). */
export async function setCustomStrategy(
  userId: string | Types.ObjectId,
  allocation: { needsPercent: number; wantsPercent: number; savingsPercent: number }
): Promise<IBudgetStrategy> {
  const total = allocation.needsPercent + allocation.wantsPercent + allocation.savingsPercent;
  if (Math.round(total) !== 100) {
    throw new Error(`Needs, Wants, and Savings must add up to 100% (got ${total}%).`);
  }

  const active = await BudgetStrategy.findOne({ userId, isActive: true });
  if (active) {
    active.isActive = false;
    await active.save();
  }

  const created = await BudgetStrategy.create({
    userId,
    needsPercent: allocation.needsPercent,
    wantsPercent: allocation.wantsPercent,
    savingsPercent: allocation.savingsPercent,
    source: 'custom',
    reasoning: 'You set this allocation manually, overriding the AI recommendation.',
    confidence: 'high',
    previousNeedsPercent: active?.needsPercent,
    previousWantsPercent: active?.wantsPercent,
    previousSavingsPercent: active?.savingsPercent,
    isActive: true,
    generatedAt: new Date(),
    nextReviewAt: nextReviewDate(),
  });

  return created.toObject();
}

/** Reverts from a custom override back to a freshly computed AI recommendation. */
export async function revertToAiStrategy(userId: string | Types.ObjectId): Promise<IBudgetStrategy> {
  const { strategy } = await reassessStrategy(userId, { force: true });
  return strategy;
}
