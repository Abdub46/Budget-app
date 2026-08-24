import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';

export async function GET() {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) return jsonError(404, 'User not found.');

    // The bot token is a credential (equivalent to a password), so it's
    // never sent back in full once saved — the client only needs to know
    // whether one is already set (see TelegramSection).
    const { botToken, ...telegramRest } = user.settings.telegram ?? {};
    const sanitizedUser = {
      ...user,
      settings: {
        ...user.settings,
        telegram: { ...telegramRest, hasBotToken: !!botToken },
      },
    };

    return NextResponse.json({ user: sanitizedUser });
  });
}