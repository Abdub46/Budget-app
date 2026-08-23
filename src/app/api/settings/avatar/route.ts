import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { avatarUpdateSchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    // Uploads are heavier than a typical settings PATCH (up to a few
    // hundred KB each), so keep this tighter than the general settings
    // limits to discourage repeated large writes.
    const limitResult = await rateLimit(`avatar-update:${userId}`, {
      limit: 10,
      windowMs: 60_000,
    });
    if (!limitResult.success) {
      return jsonError(429, 'Too many requests. Please slow down.');
    }

    const body = await req.json();
    const parsed = avatarUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      parsed.data.avatar
        ? { $set: { avatar: parsed.data.avatar } }
        : { $unset: { avatar: 1 } },
      { new: true, runValidators: true }
    );
    if (!user) return jsonError(404, 'User not found.');

    return NextResponse.json({ user });
  });
}