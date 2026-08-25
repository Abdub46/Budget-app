import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { setCustomStrategy, revertToAiStrategy } from '@/lib/budget-engine';
import { budgetStrategyOverrideSchema } from '@/lib/validations';

/** User manually overrides the AI recommendation — spec §5/§15 (AI recommends, never controls). */
export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = budgetStrategyOverrideSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    try {
      const strategy = await setCustomStrategy(userId, parsed.data);
      return NextResponse.json({ strategy });
    } catch (err: any) {
      return jsonError(400, err?.message || 'Could not save your custom allocation.');
    }
  });
}

/** Reverts a custom override back to a freshly computed AI recommendation. */
export async function DELETE() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();
    const strategy = await revertToAiStrategy(userId);
    return NextResponse.json({ strategy });
  });
}
