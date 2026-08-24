import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { runExpenseReminderJob } from '@/lib/expense-reminder';

/**
 * Checks every user with Telegram reminders enabled and messages anyone
 * whose expenses haven't been updated in 24+ hours (at most once per
 * 24-hour window — see runExpenseReminderJob). Intended to be triggered by
 * a scheduled job (Vercel Cron, GitHub Actions, a self-hosted cron, etc.)
 * — see vercel.json for the hosted schedule. Protected by CRON_SECRET so
 * it can't be triggered by an arbitrary request.
 */
export async function POST(req: Request) {
  return handleReminderRun(req);
}

// Vercel Cron triggers scheduled jobs with GET, automatically attaching
// `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set as an env var
// and this route is registered in vercel.json — see that file's `crons` entry.
export async function GET(req: Request) {
  return handleReminderRun(req);
}

async function handleReminderRun(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const results = await runExpenseReminderJob();

  return NextResponse.json({
    processed: results.length,
    results,
  });
}