import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { User } from '@/models';
import { telegramSettingsSchema } from '@/lib/validations';
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

/**
 * This was the missing piece: Save (and the Enable toggle) both PATCH this
 * endpoint, but no PATCH handler existed here before — every request 405'd,
 * so credentials never actually reached the database no matter how many
 * times "Save" was clicked, which is why the toggle kept insisting nothing
 * had been saved yet.
 */
export async function PATCH(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = telegramSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    const existing = await User.findById(userId).select('settings.telegram').lean();
    if (!existing) return jsonError(404, 'User not found.');

    const data = parsed.data;
    const nextBotToken = data.botToken !== undefined ? data.botToken || undefined : existing.settings.telegram?.botToken;
    const nextChatId = data.chatId !== undefined ? data.chatId || undefined : existing.settings.telegram?.chatId;

    if (data.enabled && (!nextBotToken || !nextChatId)) {
      // Server-side backstop matching the client's own check — never let
      // reminders be enabled without both a bot token and a chat ID on
      // file, whether from this same request or a previously saved value.
      return jsonError(400, 'Add your bot token and chat ID, then save, before enabling reminders.');
    }

    const set: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};
    if (data.botToken !== undefined) {
      if (data.botToken) set['settings.telegram.botToken'] = data.botToken;
      else unset['settings.telegram.botToken'] = '';
    }
    if (data.chatId !== undefined) {
      if (data.chatId) set['settings.telegram.chatId'] = data.chatId;
      else unset['settings.telegram.chatId'] = '';
    }
    if (data.enabled !== undefined) set['settings.telegram.enabled'] = data.enabled;

    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;

    const user = await User.findByIdAndUpdate(userId, update, { new: true, runValidators: true })
      .select('settings.telegram')
      .lean();
    if (!user) return jsonError(404, 'User not found.');

    const { botToken, ...telegramRest } = user.settings.telegram ?? {};
    return NextResponse.json({
      telegram: { ...telegramRest, hasBotToken: !!botToken },
    });
  });
}