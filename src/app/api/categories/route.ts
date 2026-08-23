import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Category } from '@/models';
import { categorySchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const categories = await Category.find({ userId }).sort({ isDefault: -1, name: 1 }).lean();
    return NextResponse.json({ categories });
  });
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const existing = await Category.findOne({ userId, name: parsed.data.name });
    if (existing) return jsonError(409, 'A category with this name already exists.');

    const category = await Category.create({ ...parsed.data, userId, isDefault: false });
    return NextResponse.json({ category }, { status: 201 });
  });
}
