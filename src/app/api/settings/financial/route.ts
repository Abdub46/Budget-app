import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { financialProfileSchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { reassessStrategy } from '@/lib/budget-engine';

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = financialProfileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const data = parsed.data;
    const update: Record<string, unknown> = {
      averageMonthlyBudget: data.averageMonthlyBudget,
      currency: data.currency.toUpperCase(),
    };
    // Only touch AI-engine inputs the client actually sent — omitted fields
    // (e.g. a client on an older build) are left untouched.
    for (const key of [
      'monthlyIncome', 'housingExpense', 'foodExpense', 'transportExpense',
      'utilitiesExpense', 'debtPayment', 'currentSavings', 'emergencyFund',
      'dependents', 'incomeStability', 'financialGoal', 'savingsGoal',
    ] as const) {
      if (data[key] !== undefined) update[key] = data[key];
    }

    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true });
    if (!user) return jsonError(404, 'User not found.');

    // A financial-profile edit is exactly the kind of "meaningful change"
    // spec §6 calls out (income, essential expenses, debt, savings, goals) —
    // re-run the AI engine now. If the new numbers don't move the
    // allocation by enough to matter, reassessStrategy leaves it as-is
    // rather than reissuing an identical recommendation.
    const { strategy, changed } = await reassessStrategy(userId);

    return NextResponse.json({ user, budgetStrategy: strategy, strategyUpdated: changed });
  });
}
