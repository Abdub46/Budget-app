import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Category, Expense } from '@/models';
import { categorySchema } from '@/lib/validations';
import { jsonError, isValidObjectId, withErrorHandling } from '@/lib/api-helpers';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid category ID.');

    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const category = await Category.findOne({ _id: params.id, userId });
    if (!category) return jsonError(404, 'Category not found.');

    if (parsed.data.name && parsed.data.name !== category.name) {
      const duplicate = await Category.findOne({
        userId,
        name: parsed.data.name,
        _id: { $ne: category._id },
      });
      if (duplicate) return jsonError(409, 'A category with this name already exists.');
    }

    Object.assign(category, parsed.data);
    await category.save();

    // Keep already-recorded expenses' denormalized categoryType in sync if the
    // category's type changed, so historical aggregations stay accurate.
    if (parsed.data.type) {
      await Expense.updateMany(
        { userId, categoryId: category._id },
        { $set: { categoryType: parsed.data.type } }
      );
    }

    return NextResponse.json({ category });
  });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid category ID.');

    await connectDB();

    const category = await Category.findOne({ _id: params.id, userId });
    if (!category) return jsonError(404, 'Category not found.');

    const usageCount = await Expense.countDocuments({ userId, categoryId: category._id });
    if (usageCount > 0) {
      return jsonError(
        409,
        `This category is used by ${usageCount} expense${usageCount === 1 ? '' : 's'}. Reassign or delete those first.`
      );
    }

    await category.deleteOne();
    return NextResponse.json({ message: 'Category deleted.' });
  });
}
