import { Types } from 'mongoose';
import { User } from '@/models';
import { resolvePeriod, shiftMonths, type MonthYear } from '@/lib/period';
import { computePeriodAnalytics, type PeriodAnalytics } from '@/lib/analytics';
import { computeBudgetComparison, monthLabel } from '@/lib/utils';

export interface FinancialContext {
  currency: string;
  employmentStatus: string;
  averageMonthlyBudget: number;
  currentMonth: {
    label: string;
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
    .select('averageMonthlyBudget currency employmentStatus')
    .lean();

  const currency = user?.currency ?? 'KES';
  const averageMonthlyBudget = user?.averageMonthlyBudget ?? 0;

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
    computePeriodAnalytics(userId, currentRange),
    computePeriodAnalytics(userId, previousRange),
    computePeriodAnalytics(userId, last6Range),
    computePeriodAnalytics(userId, yearRange),
  ]);

  return {
    currency,
    employmentStatus: user?.employmentStatus ?? 'unspecified',
    averageMonthlyBudget,
    currentMonth: {
      label: monthLabel(targetMY.month, targetMY.year),
      ...currentAnalytics,
      comparisonToAverage: computeBudgetComparison(currentAnalytics.totalBudget, averageMonthlyBudget),
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
