/**
 * Shared 50/30/20 budget-ratio logic — used by both the server (analytics
 * routes) and the client (dashboard charts, settings UI), so there is only
 * one definition of the targets, the default category mapping, and the
 * below/reached/exceeded classification.
 */
import type { CategoryType } from '@/types';

export type BudgetGroupKey = 'needs' | 'wants' | 'savings';

export const BUDGET_GROUP_KEYS: BudgetGroupKey[] = ['needs', 'wants', 'savings'];

export const BUDGET_GROUP_LABELS: Record<BudgetGroupKey, string> = {
  needs: 'Needs',
  wants: 'Wants',
  savings: 'Savings & Financial Goals',
};

export const BUDGET_GROUP_TARGET_PERCENT: Record<BudgetGroupKey, number> = {
  needs: 50,
  wants: 30,
  savings: 20,
};

/**
 * Starting-point mapping for the categories explicitly named in the 50/30/20
 * rule. Any category whose type isn't listed here (health, education, other)
 * starts unassigned — it won't count toward any of the three groups until
 * the user places it under Settings → Budget Ratio.
 *
 * This is only ever a *fallback*: a category's own `budgetGroup` field
 * (explicitly set by the user, including explicitly cleared to `null`)
 * always wins — see `effectiveBudgetGroup`.
 */
export const DEFAULT_TYPE_TO_GROUP: Partial<Record<CategoryType, BudgetGroupKey>> = {
  rent: 'needs',
  food: 'needs',
  transport: 'needs',
  utilities: 'needs',
  entertainment: 'wants',
  shopping: 'wants',
  savings: 'savings',
  investment: 'savings',
};

/**
 * Resolves which of the three groups a category actually counts toward.
 *  - `budgetGroup` explicitly set to 'needs' | 'wants' | 'savings' -> that group.
 *  - `budgetGroup` explicitly set to `null` -> the user intentionally
 *    removed it from any group, so it's unassigned regardless of type.
 *  - `budgetGroup` absent (`undefined`, never customized) -> fall back to
 *    the default type mapping above, or unassigned if the type isn't listed.
 */
export function effectiveBudgetGroup(category: {
  type: CategoryType;
  budgetGroup?: BudgetGroupKey | null;
}): BudgetGroupKey | null {
  if (category.budgetGroup === null) return null;
  if (category.budgetGroup) return category.budgetGroup;
  return DEFAULT_TYPE_TO_GROUP[category.type] ?? null;
}

export type BudgetGroupStatus = 'below' | 'reached' | 'exceeded';

export interface BudgetGroupBreakdownEntry {
  key: BudgetGroupKey;
  label: string;
  targetPercent: number;
  targetAmount: number;
  actualAmount: number;
  actualPercent: number; // as a percentage of totalBudget
  status: BudgetGroupStatus;
  /** > 0 only when status === 'below'; the amount still needed to reach the target. */
  remainingToTarget: number;
}

// Treat actual spend within half a percentage point of the target as "reached"
// rather than requiring exact equality, which would almost never happen.
const STATUS_TOLERANCE_PERCENT = 0.5;

export function computeBudgetGroupBreakdown(
  totalBudget: number,
  amountByGroup: Record<BudgetGroupKey, number>
): BudgetGroupBreakdownEntry[] {
  return BUDGET_GROUP_KEYS.map((key) => {
    const targetPercent = BUDGET_GROUP_TARGET_PERCENT[key];
    const targetAmount = (totalBudget * targetPercent) / 100;
    const actualAmount = amountByGroup[key] ?? 0;
    const actualPercent = totalBudget > 0 ? (actualAmount / totalBudget) * 100 : 0;

    let status: BudgetGroupStatus;
    if (Math.abs(actualPercent - targetPercent) <= STATUS_TOLERANCE_PERCENT) {
      status = 'reached';
    } else if (actualPercent > targetPercent) {
      status = 'exceeded';
    } else {
      status = 'below';
    }

    return {
      key,
      label: BUDGET_GROUP_LABELS[key],
      targetPercent,
      targetAmount,
      actualAmount,
      actualPercent,
      status,
      remainingToTarget: status === 'below' ? Math.max(targetAmount - actualAmount, 0) : 0,
    };
  });
}

/**
 * Sums {categoryId, amount} entries into per-group totals using a
 * categoryId -> effective group lookup. Expenses whose category has no
 * resolved group (or whose category no longer exists) are excluded from
 * all three groups — only explicitly-or-default-assigned categories count.
 */
export function sumAmountsByGroup(
  entries: Array<{ categoryId: string; amount: number }>,
  groupByCategoryId: Map<string, BudgetGroupKey | null>
): Record<BudgetGroupKey, number> {
  const totals: Record<BudgetGroupKey, number> = { needs: 0, wants: 0, savings: 0 };
  for (const entry of entries) {
    const group = groupByCategoryId.get(entry.categoryId);
    if (group) totals[group] += entry.amount;
  }
  return totals;
}