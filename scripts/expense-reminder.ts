/**
 * Standalone expense-reminder runner, for environments that use a real
 * crontab / systemd timer instead of a hosted scheduler (Vercel Cron, etc.).
 *
 * Usage:  npm run cron:expense-reminder
 *
 * This intentionally shares the exact same `runExpenseReminderJob` logic as
 * `src/app/api/cron/expense-reminder/route.ts` — there is only one
 * implementation of "how the 24h reminder check runs"; this script and the
 * API route are just two different triggers for it.
 */
import 'dotenv/config';
import { connectDB } from '../src/lib/db';
import { runExpenseReminderJob } from '../src/lib/expense-reminder';

async function run() {
  await connectDB();

  console.log('Running expense-reminder check…');

  const results = await runExpenseReminderJob();
  const sent = results.filter((r) => r.status === 'sent').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errored = results.filter((r) => r.status === 'error').length;

  console.log(`Done. Sent: ${sent}, skipped: ${skipped}, errors: ${errored}.`);
  process.exit(errored > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Expense-reminder job failed:', err);
  process.exit(1);
});