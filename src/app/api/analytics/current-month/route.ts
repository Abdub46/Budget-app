import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { MonthlyBudget, Expense, Category, User } from '@/models';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { computeBudgetComparison, monthLabel } from '@/lib/utils';
import {
  effectiveBudgetGroup,
  computeBudgetGroupBreakdown,
  sumAmountsByGroup,
  type BudgetGroupKey,
} from '@/lib/budget-groups';

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get('month') ?? String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') ?? String(now.getFullYear()), 10);

    if (!month || month < 1 || month > 12 || !year) {
      return jsonError(400, 'Invalid month or year.');
    }

    const [budget, user] = await Promise.all([
      MonthlyBudget.findOne({ userId, month, year }).lean(),
      User.findById(userId).select('averageMonthlyBudget currency').lean(),
    ]);

    const averageMonthlyBudget = user?.averageMonthlyBudget ?? 0;
    const currency = user?.currency ?? 'KES';

    if (!budget) {
      return NextResponse.json({
        label: monthLabel(month, year),
        currency,
        hasBudget: false,
        averageMonthlyBudget,
      });
    }

    const [totalExpenses, expenseTotalsByCategory, categories] = await Promise.all([
      Expense.aggregate([
        {
          $match: {
            userId: budget.userId,
            date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]).then((r) => r[0]?.total ?? 0),
      Expense.aggregate([
        {
          $match: {
            userId: budget.userId,
            date: { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) },
          },
        },
        { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      ]),
      Category.find({ userId }).select('type budgetGroup').lean(),
    ]);

    const groupByCategoryId = new Map<string, BudgetGroupKey | null>(
      categories.map((c) => [c._id.toString(), effectiveBudgetGroup(c)])
    );
    const amountByGroup = sumAmountsByGroup(
      expenseTotalsByCategory.map((r: { _id: Types.ObjectId; total: number }) => ({
        categoryId: r._id.toString(),
        amount: r.total,
      })),
      groupByCategoryId
    );
    const budgetGroups = computeBudgetGroupBreakdown(budget.totalBudget, amountByGroup);

    return NextResponse.json({
      label: monthLabel(month, year),
      currency,
      hasBudget: true,
      totalBudget: budget.totalBudget,
      initialAmount: budget.initialAmount,
      totalAdditionalAmount: budget.totalAdditionalAmount,
      totalExpenses,
      remaining: budget.totalBudget - totalExpenses,
      utilizationPercent:
        budget.totalBudget > 0 ? Math.round((totalExpenses / budget.totalBudget) * 1000) / 10 : 0,
      averageMonthlyBudget,
      comparison: computeBudgetComparison(budget.totalBudget, averageMonthlyBudget),
      budgetGroups,
    });
  });
}
