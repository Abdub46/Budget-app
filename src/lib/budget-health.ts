import { formatPercent } from '@/lib/utils';
import type { BudgetGroupBreakdownEntry } from '@/lib/budget-groups';

export type BudgetHealthStatus = 'excellent' | 'good' | 'attention' | 'critical';

export interface BudgetHealth {
  status: BudgetHealthStatus;
  label: string;
  explanation: string;
}

export const BUDGET_HEALTH_LABELS: Record<BudgetHealthStatus, string> = {
  excellent: 'Excellent',
  good: 'Good',
  attention: 'Attention Needed',
  critical: 'Critical',
};

/**
 * Every input here is a real, already-computed figure (utilization %, and
 * the Needs/Wants/Savings breakdown against the user's own AI or custom
 * targets) — nothing is hardcoded or guessed, per spec §8.
 */
export function computeBudgetHealth(
  utilizationPercent: number,
  budgetGroups: BudgetGroupBreakdownEntry[],
  currency: string
): BudgetHealth {
  const needs = budgetGroups.find((g) => g.key === 'needs');
  const wants = budgetGroups.find((g) => g.key === 'wants');
  const savings = budgetGroups.find((g) => g.key === 'savings');

  const overspendPercent = utilizationPercent - 100;
  const needsOverage = needs ? needs.actualPercent - needs.targetPercent : 0;
  const wantsOverage = wants ? wants.actualPercent - wants.targetPercent : 0;
  const anyGroupExceeded = budgetGroups.some((g) => g.status === 'exceeded');
  const worstOverage = Math.max(
    ...budgetGroups.map((g) => (g.status === 'exceeded' ? g.actualPercent - g.targetPercent : 0)),
    0
  );

  // --- Critical: overall overspend is large, or essential spending has
  // blown well past what was allocated (basic necessities at risk). ---
  if (overspendPercent >= 10 || needsOverage >= 15) {
    const explanation =
      overspendPercent >= 10
        ? `You've spent ${formatPercent(utilizationPercent)} of your total budget this month — that's a significant overspend. Essential spending should be brought back in line before anything else.`
        : `Your essential (Needs) spending is running well above your recommended allocation, which puts pressure on your ability to cover basic necessities.`;
    return { status: 'critical', label: BUDGET_HEALTH_LABELS.critical, explanation };
  }

  // --- Attention Needed: some overspend, or a category meaningfully exceeded. ---
  if (overspendPercent > 0 || worstOverage >= 8) {
    const overCategory = wantsOverage >= 8 ? 'lifestyle (Wants)' : needsOverage >= 8 ? 'essential (Needs)' : null;
    const explanation = overCategory
      ? `You're within your overall budget, but your ${overCategory} spending is above the recommended allocation. Keep an eye on it for the rest of the month.`
      : `You're slightly over your overall budget for this period. A few adjustments would bring things back on track.`;
    return { status: 'attention', label: BUDGET_HEALTH_LABELS.attention, explanation };
  }

  // --- Good: within budget overall, no category badly exceeded, but not
  // everything is comfortably on/under target either. ---
  if (anyGroupExceeded || utilizationPercent > 85) {
    const explanation = anyGroupExceeded
      ? `You're currently within your overall budget, but one category is running above the AI recommendation. Overall your financial position is healthy.`
      : `You're within budget and on track, though you're using a large share of it — worth watching as the month progresses.`;
    return { status: 'good', label: BUDGET_HEALTH_LABELS.good, explanation };
  }

  // --- Excellent: comfortably within budget, no category exceeded. ---
  const savingsNote =
    savings && savings.status !== 'exceeded'
      ? ' and your savings & investments allocation is on track'
      : '';
  return {
    status: 'excellent',
    label: BUDGET_HEALTH_LABELS.excellent,
    explanation: `You're within your overall budget${savingsNote}. Keep it up.`,
  };
}
