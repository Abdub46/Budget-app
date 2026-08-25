/**
 * Standalone month-end report runner, for environments that use a real
 * crontab / systemd timer instead of a hosted scheduler (Vercel Cron, etc.).
 *
 * Usage:  npm run cron:month-end
 *
 * This intentionally shares the exact same `generateAndSendMonthlyReport`
 * logic as `src/app/api/cron/month-end/route.ts` — there is only one
 * implementation of "how a monthly report gets generated and sent"; this
 * script and the API route are just two different triggers for it.
 */
import 'dotenv/config';
import { connectDB } from '../src/lib/db';
import { MonthlyBudget, Report, User } from '../src/models';
import { generateAndSendMonthlyReport } from '../src/lib/reports';
import { reassessStrategy } from '../src/lib/budget-engine';
import { shiftMonths, type MonthYear } from '../src/lib/period';

async function run() {
  await connectDB();

  const now = new Date();
  const nowMY: MonthYear = { month: now.getMonth() + 1, year: now.getFullYear() };
  const target = shiftMonths(nowMY, -1);

  console.log(`Running month-end report generation for ${target.month}/${target.year}…`);

  const users = await User.find({}).select('_id settings').lean();
  let sent = 0;
  let skipped = 0;
  let errored = 0;

  for (const user of users) {
    try {
      if (user.settings?.notifications?.monthlyReports === false) {
        skipped++;
        continue;
      }

      const [budgetExists, alreadyReported] = await Promise.all([
        MonthlyBudget.exists({ userId: user._id, month: target.month, year: target.year }),
        Report.exists({ userId: user._id, month: target.month, year: target.year }),
      ]);

      if (!budgetExists || alreadyReported) {
        skipped++;
        continue;
      }

      await generateAndSendMonthlyReport(user._id, target);
      await reassessStrategy(user._id).catch((err) =>
        console.error(`Strategy reassessment failed for user ${user._id}:`, err)
      );
      sent++;
    } catch (err) {
      console.error(`Failed for user ${user._id}:`, err);
      errored++;
    }
  }

  console.log(`Done. Sent: ${sent}, skipped: ${skipped}, errors: ${errored}.`);
  process.exit(errored > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Month-end job failed:', err);
  process.exit(1);
});
