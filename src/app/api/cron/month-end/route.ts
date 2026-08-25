import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MonthlyBudget, Report, User } from '@/models';
import { generateAndSendMonthlyReport } from '@/lib/reports';
import { reassessStrategy } from '@/lib/budget-engine';
import { shiftMonths, type MonthYear } from '@/lib/period';

/**
 * Intended to be triggered by a scheduled job (Vercel Cron, GitHub Actions,
 * a self-hosted cron, etc.) shortly after the start of each month, so the
 * *previous* month's budget is fully "closed". Protected by CRON_SECRET so
 * it can't be triggered by an arbitrary request.
 *
 * Duplicate prevention: `generateAndSendMonthlyReport` -> `generateMonthlyReport`
 * checks for an existing Report first, and the Report model's unique
 * (userId, year, month) index is the hard backstop against duplicates even
 * under concurrent invocations.
 */
export async function POST(req: Request) {
  return handleMonthEndRun(req);
}

// Vercel Cron triggers scheduled jobs with GET, automatically attaching
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set as an env var
// and this route is registered in vercel.json — see that file's `crons` entry.
export async function GET(req: Request) {
  return handleMonthEndRun(req);
}

async function handleMonthEndRun(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const now = new Date();
  const nowMY: MonthYear = { month: now.getMonth() + 1, year: now.getFullYear() };
  const target = shiftMonths(nowMY, -1); // the month that just completed

  const users = await User.find({}).select('_id settings').lean();

  const results: Array<{ userId: string; status: 'sent' | 'skipped' | 'error'; reason?: string }> = [];

  for (const user of users) {
    try {
      if (user.settings?.notifications?.monthlyReports === false) {
        results.push({ userId: user._id.toString(), status: 'skipped', reason: 'reports disabled' });
        continue;
      }

      const [budgetExists, alreadyReported] = await Promise.all([
        MonthlyBudget.exists({ userId: user._id, month: target.month, year: target.year }),
        Report.exists({ userId: user._id, month: target.month, year: target.year }),
      ]);

      if (!budgetExists) {
        results.push({ userId: user._id.toString(), status: 'skipped', reason: 'no budget for month' });
        continue;
      }
      if (alreadyReported) {
        results.push({ userId: user._id.toString(), status: 'skipped', reason: 'already generated' });
        continue;
      }

      await generateAndSendMonthlyReport(user._id, target);

      // New budgeting cycle starting — spec §6: reassess the AI strategy at
      // the beginning of each new month. The report just generated above
      // still reflects the strategy that was active during `target`, since
      // this reassessment only runs after the snapshot is built.
      await reassessStrategy(user._id).catch((err) =>
        console.error(`Month-end strategy reassessment failed for user ${user._id}:`, err)
      );

      results.push({ userId: user._id.toString(), status: 'sent' });
    } catch (err: any) {
      console.error(`Month-end report failed for user ${user._id}:`, err);
      results.push({ userId: user._id.toString(), status: 'error', reason: err?.message });
    }
  }

  return NextResponse.json({
    target: `${target.month}/${target.year}`,
    processed: results.length,
    results,
  });
}
