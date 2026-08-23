import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { passwordChangeSchema } from '@/lib/validations';
import { hashPassword, verifyPassword } from '@/lib/password';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    const limitResult = rateLimit(`password-change:${userId}`, { limit: 5, windowMs: 10 * 60_000 });
    if (!limitResult.success) {
      return jsonError(429, 'Too many attempts. Please try again later.');
    }

    const body = await req.json();
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const user = await User.findById(userId).select('+password');
    if (!user) return jsonError(404, 'User not found.');

    const isValid = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!isValid) return jsonError(401, 'Current password is incorrect.');

    user.password = await hashPassword(parsed.data.newPassword);
    await user.save();

    return NextResponse.json({ message: 'Password updated.' });
  });
}
