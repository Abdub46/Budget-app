import { Types } from 'mongoose';
import { User } from '@/models';
import { resolvePeriod, shiftMonths, type MonthYear } from '@/lib/period';
import { computePeriodAnalytics, type PeriodAnalytics } from '@/lib/analytics';
import { computeBudgetComparison, monthLabel } from '@/lib/utils';
import { targetPercentsFromStrategy } from '@/lib/budget-groups';
import { ensureStrategy } from '@/lib/budget-engine';
import { computeBudgetHealth, type BudgetHealth } from '@/lib/budget-health';

export interface FinancialContext {
  currency: string;
  employmentStatus: string;
  incomeStability: string;
  averageMonthlyBudget: number;
  monthlyIncome: number;
  dependents: number;
  // Only included when the user has actually provided figures — never
  // invented, so the assistant can honestly say "not available" otherwise.
  essentialExpenses: {
    housing: number;
    food: number;
    transport: number;
    utilities: number;
    debtPayment: number;
  };
  currentSavings: number;
  emergencyFund: number;
  financialGoal?: string;
  savingsGoal?: string;
  budgetStrategy: {
    needsPercent: number;
    wantsPercent: number;
    savingsPercent: number;
    source: 'ai' | 'custom';
    reasoning: string;
    confidence: string;
    generatedAt: Date;
    nextReviewAt: Date;
    changeReason?: string;
  };
  currentMonth: {
    label: string;
    budgetHealth: BudgetHealth;
  } & PeriodAnalytics & {
      comparisonToAverage: ReturnType<typeof computeBudgetComparison>;
    };
  previousMonth: { label: string } & PeriodAnalytics;
  last6Months: { label: string } & PeriodAnalytics;
  yearToDate: { label: string; totalSavings: number; totalInvestments: number; totalExpenses: number };
}

/**
 * Builds a compact, aggregated snapshot of ONE user's finances centered on
 * `targetMonth` (defaults to the real current month) -- that month, the
 * month before it, a trailing 6-month rollup, and year-to-date savings/
 * investment totals. This is intentionally a summary, not a database dump:
 * callers never receive raw per-expense rows or any other user's data.
 * Every query here is scoped to `userId`, which the caller must have
 * obtained via `requireUserId()` (never from client-supplied input).
 *
 * `targetMonth` lets this same builder power both the AI Assistant (current
 * month) and monthly PDF reports (an arbitrary past month).
 */
export async function getFinancialContext(
  userId: string | Types.ObjectId,
  targetMonth?: MonthYear
): Promise<FinancialContext> {
  const user = await User.findById(userId)
    .select(
      'averageMonthlyBudget currency employmentStatus incomeStability monthlyIncome dependents ' +
        'housingExpense foodExpense transportExpense utilitiesExpense debtPayment ' +
        'currentSavings emergencyFund financialGoal savingsGoal'
    )
    .lean();

  const currency = user?.currency ?? 'KES';
  const averageMonthlyBudget = user?.averageMonthlyBudget ?? 0;
  const strategy = await ensureStrategy(userId);
  const targetPercentByGroup = targetPercentsFromStrategy(strategy);

  const now = new Date();
  const targetMY: MonthYear = targetMonth ?? { month: now.getMonth() + 1, year: now.getFullYear() };
  const previousMY = shiftMonths(targetMY, -1);

  const currentRange = resolvePeriod('custom', targetMY, { customFrom: targetMY, customTo: targetMY });
  const previousRange = resolvePeriod('custom', targetMY, { customFrom: previousMY, customTo: previousMY });
  const last6Range = resolvePeriod('custom', targetMY, {
    customFrom: shiftMonths(targetMY, -5),
    customTo: targetMY,
  });
  const yearRange = resolvePeriod('custom', targetMY, {
    customFrom: { month: 1, year: targetMY.year },
    customTo: targetMY,
  });

  const [currentAnalytics, previousAnalytics, last6Analytics, yearAnalytics] = await Promise.all([
    computePeriodAnalytics(userId, currentRange, targetPercentByGroup),
    computePeriodAnalytics(userId, previousRange, targetPercentByGroup),
    computePeriodAnalytics(userId, last6Range, targetPercentByGroup),
    computePeriodAnalytics(userId, yearRange, targetPercentByGroup),
  ]);

  return {
    currency,
    employmentStatus: user?.employmentStatus ?? 'unspecified',
    incomeStability: (user as any)?.incomeStability ?? 'unspecified',
    averageMonthlyBudget,
    monthlyIncome: (user as any)?.monthlyIncome ?? 0,
    dependents: (user as any)?.dependents ?? 0,
    essentialExpenses: {
      housing: (user as any)?.housingExpense ?? 0,
      food: (user as any)?.foodExpense ?? 0,
      transport: (user as any)?.transportExpense ?? 0,
      utilities: (user as any)?.utilitiesExpense ?? 0,
      debtPayment: (user as any)?.debtPayment ?? 0,
    },
    currentSavings: (user as any)?.currentSavings ?? 0,
    emergencyFund: (user as any)?.emergencyFund ?? 0,
    financialGoal: (user as any)?.financialGoal,
    savingsGoal: (user as any)?.savingsGoal,
    budgetStrategy: {
      needsPercent: strategy.needsPercent,
      wantsPercent: strategy.wantsPercent,
      savingsPercent: strategy.savingsPercent,
      source: strategy.source,
      reasoning: strategy.reasoning,
      confidence: strategy.confidence,
      generatedAt: strategy.generatedAt,
      nextReviewAt: strategy.nextReviewAt,
      changeReason: strategy.changeReason,
    },
    currentMonth: {
      label: monthLabel(targetMY.month, targetMY.year),
      ...currentAnalytics,
      comparisonToAverage: computeBudgetComparison(currentAnalytics.totalBudget, averageMonthlyBudget),
      budgetHealth: computeBudgetHealth(currentAnalytics.utilizationPercent, currentAnalytics.budgetGroups, currency),
    },
    previousMonth: { label: previousRange.label, ...previousAnalytics },
    last6Months: { label: last6Range.label, ...last6Analytics },
    yearToDate: {
      label: yearRange.label,
      totalSavings: yearAnalytics.totalSavings,
      totalInvestments: yearAnalytics.totalInvestments,
      totalExpenses: yearAnalytics.totalExpenses,
    },
  };
}
