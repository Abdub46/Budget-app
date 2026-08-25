import { Types } from 'mongoose';
import { MonthlyBudget, Expense, Category } from '@/models';
import type { CategoryType } from '@/types';
import { computeBudgetComparison } from '@/lib/utils';
import { enumerateMonths, toYearMonth, type MonthYear, type PeriodRange } from '@/lib/period';
import {
  effectiveBudgetGroup,
  computeBudgetGroupBreakdown,
  sumAmountsByGroup,
  type BudgetGroupBreakdownEntry,
  type BudgetGroupKey,
} from '@/lib/budget-groups';

export interface CategoryBreakdownEntry {
  category: CategoryType;
  amount: number;
}

export interface MonthlySeriesPoint {
  month: number;
  year: number;
  label: string;
  budget: number;
  expenses: number;
  savingsInvestments: number;
}

export interface PeriodAnalytics {
  totalBudget: number;
  totalExpenses: number;
  remaining: number;
  totalSavings: number;
  totalInvestments: number;
  categoryBreakdown: CategoryBreakdownEntry[];
  highestCategory: CategoryBreakdownEntry | null;
  lowestCategory: CategoryBreakdownEntry | null;
  averageActualBudget: number; // mean totalBudget across months that have a budget
  monthsWithBudget: number;
  monthlySeries: MonthlySeriesPoint[];
  utilizationPercent: number;
  budgetGroups: BudgetGroupBreakdownEntry[];
}

function monthDateRange(range: PeriodRange) {
  const from = new Date(range.start.year, range.start.month - 1, 1);
  const to = new Date(range.end.year, range.end.month, 1); // exclusive
  return { from, to };
}

export async function computePeriodAnalytics(
  userId: string | Types.ObjectId,
  range: PeriodRange,
  targetPercentByGroup?: Record<BudgetGroupKey, number>
): Promise<PeriodAnalytics> {
  const { from, to } = monthDateRange(range);
  const startYm = toYearMonth(range.start);
  const endYm = toYearMonth(range.end);

  const [allBudgets, expenses, categories] = await Promise.all([
    MonthlyBudget.find({
      userId,
      year: { $gte: range.start.year, $lte: range.end.year },
    }).lean(),
    Expense.find({ userId, date: { $gte: from, $lt: to } }).lean(),
    Category.find({ userId }).select('type budgetGroup').lean(),
  ]);

  const budgetsInRange = allBudgets.filter((b) => {
    const ym = toYearMonth({ month: b.month, year: b.year });
    return ym >= startYm && ym <= endYm;
  });

  const totalBudget = budgetsInRange.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = new Map<CategoryType, number>();
  for (const e of expenses) {
    byCategory.set(e.categoryType, (byCategory.get(e.categoryType) ?? 0) + e.amount);
  }
  const categoryBreakdown: CategoryBreakdownEntry[] = Array.from(byCategory.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const totalSavings = byCategory.get('savings') ?? 0;
  const totalInvestments = byCategory.get('investment') ?? 0;

  const highestCategory = categoryBreakdown[0] ?? null;
  const lowestCategory =
    categoryBreakdown.length > 0 ? categoryBreakdown[categoryBreakdown.length - 1] : null;

  const monthsList = enumerateMonths(range.start, range.end);
  const monthlySeries: MonthlySeriesPoint[] = monthsList.map((my: MonthYear) => {
    const budgetDoc = budgetsInRange.find((b) => b.month === my.month && b.year === my.year);
    const monthExpenses = expenses.filter(
      (e) => e.date.getFullYear() === my.year && e.date.getMonth() + 1 === my.month
    );
    const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthSavingsInvestments = monthExpenses
      .filter((e) => e.categoryType === 'savings' || e.categoryType === 'investment')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month: my.month,
      year: my.year,
      label: `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][my.month - 1]} ${my.year}`,
      budget: budgetDoc?.totalBudget ?? 0,
      expenses: monthTotal,
      savingsInvestments: monthSavingsInvestments,
    };
  });

  const averageActualBudget =
    budgetsInRange.length > 0 ? totalBudget / budgetsInRange.length : 0;

  const groupByCategoryId = new Map<string, BudgetGroupKey | null>(
    categories.map((c) => [c._id.toString(), effectiveBudgetGroup(c)])
  );
  const amountByGroup = sumAmountsByGroup(
    expenses.map((e) => ({ categoryId: e.categoryId.toString(), amount: e.amount })),
    groupByCategoryId
  );
  const budgetGroups = computeBudgetGroupBreakdown(totalBudget, amountByGroup, targetPercentByGroup);

  return {
    totalBudget,
    totalExpenses,
    remaining: totalBudget - totalExpenses,
    totalSavings,
    totalInvestments,
    categoryBreakdown,
    highestCategory,
    lowestCategory,
    averageActualBudget,
    monthsWithBudget: budgetsInRange.length,
    monthlySeries,
    utilizationPercent: totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0,
    budgetGroups,
  };
}

export { computeBudgetComparison };
