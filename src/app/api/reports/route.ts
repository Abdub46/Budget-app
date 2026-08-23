import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Report } from '@/models';
import { parsePagination, paginatedResponse, withErrorHandling } from '@/lib/api-helpers';

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const filter = { userId };
    const [items, total] = await Promise.all([
      Report.find(filter)
        .select('-snapshot') // history list doesn't need the full figures payload
        .sort({ year: -1, month: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, limit));
  });
}
