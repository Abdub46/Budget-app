import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    // Tighter than the settings-update limit — this hits an external API.
    const limitResult = await rateLimit(`telegram-test-send:${userId}`, {
      limit: 5,
      windowMs: 60_000,
    });
    if (!limitResult.success) {
      return jsonError(429, 'Too many requests. Please slow down.');
    }

    await connectDB();

    const user = await User.findById(userId).select('name settings.telegram').lean();
    if (!user) return jsonError(404, 'User not found.');

    const { botToken, chatId } = user.settings?.telegram ?? {};
    if (!botToken || !chatId) {
      return jsonError(400, 'Save your bot token and chat ID first, then send a test.');
    }

    const result = await sendTelegramMessage({
      botToken,
      chatId,
      text: `✅ This is a test message from <b>Budget</b>, ${user.name.split(' ')[0]}. Telegram reminders are wired up correctly.`,
    });

    if (!result.ok) {
      return jsonError(400, result.error || 'Could not send the test message.');
    }

    return NextResponse.json({ success: true });
  });
}