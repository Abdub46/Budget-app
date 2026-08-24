/**
 * Core "haven't logged an expense in 24h" reminder job, shared between the
 * hosted cron route (src/app/api/cron/expense-reminder/route.ts) and the
 * standalone script (scripts/expense-reminder.ts) — same pattern as
 * src/lib/reports.ts / month-end. There is only one implementation of "how
 * a reminder gets checked and sent"; the route and script are just two
 * different triggers for it.
 */
import { Expense, User } from '@/models';
import type { IUser } from '@/models/User';
import { sendTelegramMessage } from '@/lib/telegram';

const REMINDER_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export type ReminderRunStatus = 'sent' | 'skipped' | 'error';

export interface ReminderRunResult {
  userId: string;
  status: ReminderRunStatus;
  reason?: string;
}

/**
 * Finds the timestamp of the user's most recent expense activity (creating
 * OR editing an expense both count, since either shows the dashboard is
 * being kept current). Falls back to the account's creation date for users
 * who have never logged a single expense yet, so a brand-new, inactive
 * account still eventually gets nudged to add its first one.
 */
async function getLastExpenseActivityAt(userId: IUser['_id'], accountCreatedAt: Date): Promise<Date> {
  const latest = await Expense.findOne({ userId }).sort({ updatedAt: -1 }).select('updatedAt').lean();
  return latest?.updatedAt ?? accountCreatedAt;
}

function buildReminderText(name: string, hoursSinceActivity: number): string {
  const firstName = name.split(' ')[0];
  const days = Math.floor(hoursSinceActivity / 24);
  const sinceText = days >= 2 ? `in the last ${days} days` : 'in over 24 hours';
  return (
    `👋 Hi ${firstName}, just a nudge from <b>Budget</b> — ` +
    `you haven't logged any expenses ${sinceText}. ` +
    `Keeping your dashboard up to date helps your monthly reports and insights stay accurate.`
  );
}

/**
 * Runs one pass of the reminder check across every user with Telegram
 * reminders enabled. Safe to call as often as you like — each user is only
 * ever messaged once per 24-hour window, tracked via
 * `settings.telegram.lastReminderSentAt`.
 */
export async function runExpenseReminderJob(): Promise<ReminderRunResult[]> {
  const users = await User.find({ 'settings.telegram.enabled': true })
    .select('_id name createdAt settings.telegram')
    .lean();

  const results: ReminderRunResult[] = [];
  const now = Date.now();

  for (const user of users) {
    const userId = user._id.toString();
    const telegram = user.settings?.telegram;

    try {
      if (!telegram?.botToken || !telegram?.chatId) {
        results.push({ userId, status: 'skipped', reason: 'missing bot token or chat ID' });
        continue;
      }

      const lastActivityAt = await getLastExpenseActivityAt(user._id, user.createdAt);
      const hoursSinceActivity = (now - lastActivityAt.getTime()) / (60 * 60 * 1000);

      if (now - lastActivityAt.getTime() < REMINDER_THRESHOLD_MS) {
        results.push({ userId, status: 'skipped', reason: 'expenses recently updated' });
        continue;
      }

      const lastReminderSentAt = telegram.lastReminderSentAt;
      if (lastReminderSentAt && now - new Date(lastReminderSentAt).getTime() < REMINDER_THRESHOLD_MS) {
        results.push({ userId, status: 'skipped', reason: 'already reminded within 24h' });
        continue;
      }

      const send = await sendTelegramMessage({
        botToken: telegram.botToken,
        chatId: telegram.chatId,
        text: buildReminderText(user.name, hoursSinceActivity),
      });

      if (!send.ok) {
        results.push({ userId, status: 'error', reason: send.error });
        continue;
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { 'settings.telegram.lastReminderSentAt': new Date() } }
      );
      results.push({ userId, status: 'sent' });
    } catch (err: any) {
      console.error(`Expense reminder failed for user ${userId}:`, err);
      results.push({ userId, status: 'error', reason: err?.message });
    }
  }

  return results;
}