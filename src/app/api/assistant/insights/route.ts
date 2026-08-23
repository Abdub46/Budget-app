import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { withErrorHandling } from '@/lib/api-helpers';
import { getFinancialContext } from '@/lib/ai-context';
import { generateInsights } from '@/lib/insights';

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const context = await getFinancialContext(userId);
    const insights = generateInsights(context);

    return NextResponse.json({ insights, currency: context.currency });
  });
}
