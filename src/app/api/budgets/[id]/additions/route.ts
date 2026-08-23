import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { MonthlyBudget, BudgetAddition } from '@/models';
import { budgetAdditionSchema } from '@/lib/validations';
import { jsonError, isValidObjectId, parsePagination, paginatedResponse, withErrorHandling } from '@/lib/api-helpers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid budget ID.');

    await connectDB();

    const budget = await MonthlyBudget.findOne({ _id: params.id, userId }).select('_id').lean();
    if (!budget) return jsonError(404, 'Budget not found.');

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const filter = { budgetId: params.id, userId };

    const [items, total] = await Promise.all([
      BudgetAddition.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      BudgetAddition.countDocuments(filter),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid budget ID.');

    const body = await req.json();
    const parsed = budgetAdditionSchema.safeParse({ ...body, budgetId: params.id });
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }
    const { amount, description, date } = parsed.data;

    await connectDB();

    // Ownership check first — never trust the path param alone.
    const budget = await MonthlyBudget.findOne({ _id: params.id, userId });
    if (!budget) return jsonError(404, 'Budget not found.');

    const addition = await BudgetAddition.create({
      userId,
      budgetId: budget._id,
      amount,
      description,
      date: date ?? new Date(),
    });

    // The initial amount is never touched — only additional/total are incremented,
    // so history (what was originally planned vs. added later) is preserved.
    const updatedBudget = await MonthlyBudget.findByIdAndUpdate(
      budget._id,
      { $inc: { totalAdditionalAmount: amount, totalBudget: amount } },
      { new: true }
    ).lean();

    return NextResponse.json({ addition, budget: updatedBudget }, { status: 201 });
  });
}
