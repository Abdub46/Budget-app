import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Expense, Category } from '@/models';
import { expenseSchema } from '@/lib/validations';
import { jsonError, isValidObjectId, withErrorHandling } from '@/lib/api-helpers';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid expense ID.');

    await connectDB();
    const expense = await Expense.findOne({ _id: params.id, userId })
      .populate('categoryId', 'name icon type')
      .lean();
    if (!expense) return jsonError(404, 'Expense not found.');

    return NextResponse.json({ expense });
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid expense ID.');

    const body = await req.json();
    const parsed = expenseSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const existing = await Expense.findOne({ _id: params.id, userId });
    if (!existing) return jsonError(404, 'Expense not found.');

    let categoryType = existing.categoryType;
    if (parsed.data.categoryId) {
      const category = await Category.findOne({ _id: parsed.data.categoryId, userId });
      if (!category) return jsonError(404, 'Category not found.');
      categoryType = category.type;
    }

    Object.assign(existing, parsed.data, { categoryType });
    await existing.save();

    return NextResponse.json({ expense: existing });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid expense ID.');

    await connectDB();
    const deleted = await Expense.findOneAndDelete({ _id: params.id, userId });
    if (!deleted) return jsonError(404, 'Expense not found.');

    return NextResponse.json({ message: 'Expense deleted.' });
  });
}
