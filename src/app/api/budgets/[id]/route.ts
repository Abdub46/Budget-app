import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { MonthlyBudget, BudgetAddition, Expense, User } from '@/models';
import { jsonError, isValidObjectId, withErrorHandling } from '@/lib/api-helpers';
import { computeBudgetComparison } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid budget ID.');

    await connectDB();

    const budget = await MonthlyBudget.findOne({ _id: params.id, userId }).lean();
    if (!budget) return jsonError(404, 'Budget not found.');

    const [additions, expenseAgg, user] = await Promise.all([
      BudgetAddition.find({ budgetId: budget._id, userId }).sort({ date: -1 }).lean(),
      Expense.aggregate([
        {
          $match: {
            userId: budget.userId,
            date: {
              $gte: new Date(budget.year, budget.month - 1, 1),
              $lt: new Date(budget.year, budget.month, 1),
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.findById(userId).select('averageMonthlyBudget currency').lean(),
    ]);

    const totalExpenses = expenseAgg[0]?.total ?? 0;
    const average = user?.averageMonthlyBudget ?? 0;

    return NextResponse.json({
      budget: {
        ...budget,
        remaining: budget.totalBudget - totalExpenses,
        utilizationPercent:
          budget.totalBudget > 0
            ? Math.round((totalExpenses / budget.totalBudget) * 1000) / 10
            : 0,
        comparison: computeBudgetComparison(budget.totalBudget, average),
      },
      additions,
      totalExpenses,
    });
  });
}
