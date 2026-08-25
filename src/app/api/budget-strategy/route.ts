import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { ensureStrategy, getStrategyHistory, reassessStrategy } from '@/lib/budget-engine';
import { rateLimit } from '@/lib/rate-limit';

/** Current active strategy + recent history, so the dashboard can show "Budget Strategy" and compare past months. */
export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const [strategy, history] = await Promise.all([
      ensureStrategy(userId),
      getStrategyHistory(userId),
    ]);

    return NextResponse.json({ strategy, history });
  });
}

/**
 * Manually re-run the AI engine. Normally the engine only reassesses on a
 * meaningful change (spec §6), but the user can force a fresh look (e.g.
 * right after updating their Financial Profile) — rate-limited since it's
 * a write.
 */
export async function POST() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    const limitResult = await rateLimit(`budget-strategy-regenerate:${userId}`, {
      limit: 10,
      windowMs: 60 * 60_000,
    });
    if (!limitResult.success) {
      return jsonError(429, 'Too many regeneration requests. Please try again later.');
    }

    await connectDB();
    const { strategy, changed } = await reassessStrategy(userId, { force: true });

    return NextResponse.json({ strategy, changed });
  });
}
