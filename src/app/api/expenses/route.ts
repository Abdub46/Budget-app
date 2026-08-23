import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Expense, Category } from '@/models';
import { expenseSchema } from '@/lib/validations';
import { jsonError, parsePagination, paginatedResponse, withErrorHandling } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const categoryType = searchParams.get('categoryType');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const filter: Record<string, unknown> = { userId };

    if (categoryType) filter.categoryType = categoryType;

    if (month && year) {
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      filter.date = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) };
    } else if (from || to) {
      filter.date = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {}),
      };
    }

    const [items, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name icon type')
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    const limitResult = await rateLimit(`expense-create:${userId}`, { limit: 60, windowMs: 60_000 });
    if (!limitResult.success) {
      return jsonError(429, 'Too many requests. Please slow down.');
    }

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    // Verify the category belongs to this user before attaching it.
    const category = await Category.findOne({ _id: parsed.data.categoryId, userId });
    if (!category) return jsonError(404, 'Category not found.');

    const expense = await Expense.create({
      ...parsed.data,
      categoryType: category.type,
      userId,
    });

    return NextResponse.json({ expense }, { status: 201 });
  });
}
