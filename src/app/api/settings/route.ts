import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) return jsonError(404, 'User not found.');

    return NextResponse.json({ user });
  });
}
