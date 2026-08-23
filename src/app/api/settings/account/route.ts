import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

const accountSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  email: z.string().trim().email().optional(),
});

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = accountSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    if (parsed.data.email) {
      const existing = await User.findOne({
        email: parsed.data.email.toLowerCase(),
        _id: { $ne: userId },
      });
      if (existing) return jsonError(409, 'That email is already in use.');
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(parsed.data.name && { name: parsed.data.name }),
        ...(parsed.data.phone && { phone: parsed.data.phone }),
        ...(parsed.data.email && { email: parsed.data.email.toLowerCase() }),
      },
      { new: true, runValidators: true }
    );
    if (!user) return jsonError(404, 'User not found.');

    return NextResponse.json({ user });
  });
}
