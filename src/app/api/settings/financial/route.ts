import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { financialProfileSchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = financialProfileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      userId,
      {
        averageMonthlyBudget: parsed.data.averageMonthlyBudget,
        currency: parsed.data.currency.toUpperCase(),
      },
      { new: true, runValidators: true }
    );
    if (!user) return jsonError(404, 'User not found.');

    return NextResponse.json({ user });
  });
}
