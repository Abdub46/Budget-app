import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { MonthlyBudget, User } from '@/models';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { resolvePeriod, type MonthYear } from '@/lib/period';
import { computePeriodAnalytics, computeBudgetComparison } from '@/lib/analytics';
import type { PeriodPreset } from '@/types';

const VALID_PRESETS: PeriodPreset[] = [
  'current-month', 'previous-month', 'last-3-months',
  'last-6-months', 'last-12-months', 'all-months', 'custom',
];

export async function GET(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const presetParam = (searchParams.get('period') as PeriodPreset) || 'current-month';
    const preset = VALID_PRESETS.includes(presetParam) ? presetParam : 'current-month';

    const now = new Date();
    const nowMY: MonthYear = { month: now.getMonth() + 1, year: now.getFullYear() };

    let firstBudgetMonth: MonthYear | null = null;
    if (preset === 'all-months') {
      const earliest = await MonthlyBudget.findOne({ userId }).sort({ year: 1, month: 1 }).lean();
      firstBudgetMonth = earliest ? { month: earliest.month, year: earliest.year } : nowMY;
    }

    let customFrom: MonthYear | undefined;
    let customTo: MonthYear | undefined;
    if (preset === 'custom') {
      const fromMonth = parseInt(searchParams.get('fromMonth') ?? '', 10);
      const fromYear = parseInt(searchParams.get('fromYear') ?? '', 10);
      const toMonth = parseInt(searchParams.get('toMonth') ?? '', 10);
      const toYear = parseInt(searchParams.get('toYear') ?? '', 10);
      if (!fromMonth || !fromYear || !toMonth || !toYear) {
        return jsonError(400, 'Custom range requires fromMonth, fromYear, toMonth, toYear.');
      }
      customFrom = { month: fromMonth, year: fromYear };
      customTo = { month: toMonth, year: toYear };
    }

    const range = resolvePeriod(preset, nowMY, { firstBudgetMonth, customFrom, customTo });

    const [analytics, user] = await Promise.all([
      computePeriodAnalytics(userId, range),
      User.findById(userId).select('averageMonthlyBudget currency').lean(),
    ]);

    const averageMonthlyBudget = user?.averageMonthlyBudget ?? 0;
    const comparison = computeBudgetComparison(analytics.averageActualBudget, averageMonthlyBudget);

    return NextResponse.json({
      period: { preset, ...range },
      currency: user?.currency ?? 'KES',
      averageMonthlyBudget,
      averageActualBudgetComparison: comparison,
      ...analytics,
    });
  });
}
