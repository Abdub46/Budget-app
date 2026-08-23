import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { MonthlyBudget, User } from '@/models';
import { monthlyBudgetSchema } from '@/lib/validations';
import { jsonError, parsePagination, paginatedResponse, withErrorHandling } from '@/lib/api-helpers';
import { computeBudgetComparison } from '@/lib/utils';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const { page, limit, skip } = parsePagination(searchParams);

    const filter: Record<string, unknown> = { userId };
    if (year) filter.year = parseInt(year, 10);

    const [budgets, total, user] = await Promise.all([
      MonthlyBudget.find(filter).sort({ year: -1, month: -1 }).skip(skip).limit(limit).lean(),
      MonthlyBudget.countDocuments(filter),
      User.findById(userId).select('averageMonthlyBudget currency').lean(),
    ]);

    const average = user?.averageMonthlyBudget ?? 0;
    const withComparison = budgets.map((b) => ({
      ...b,
      comparison: computeBudgetComparison(b.totalBudget, average),
    }));

    return NextResponse.json(paginatedResponse(withComparison, total, page, limit));
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    const limitResult = rateLimit(`budget-create:${userId}`, { limit: 20, windowMs: 60_000 });
    if (!limitResult.success) {
      return jsonError(429, 'Too many requests. Please slow down.');
    }

    const body = await req.json();
    const parsed = monthlyBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    const { month, year, initialAmount } = parsed.data;
    await connectDB();

    const existing = await MonthlyBudget.findOne({ userId, month, year });
    if (existing) {
      return jsonError(
        409,
        `A budget for ${month}/${year} already exists. Use "Add funds" to top it up instead.`
      );
    }

    const budget = await MonthlyBudget.create({
      userId,
      month,
      year,
      initialAmount,
      totalAdditionalAmount: 0,
      totalBudget: initialAmount,
    });

    return NextResponse.json({ budget }, { status: 201 });
  });
}
