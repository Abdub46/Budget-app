/**
 * Minimal Telegram Bot API wrapper. Each user brings their own bot token +
 * chat ID (set in Settings → Telegram Reminders), so there's no shared
 * app-level bot — every call is scoped to the credentials passed in.
 *
 * See: https://core.telegram.org/bots/api#sendmessage
 */

export interface SendTelegramMessageResult {
  ok: boolean;
  error?: string;
}

export async function sendTelegramMessage(params: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<SendTelegramMessageResult> {
  const { botToken, chatId, text } = params;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      // Telegram's error `description` is human-readable and safe to
      // surface directly (e.g. "Unauthorized", "chat not found").
      return { ok: false, error: data?.description || `Telegram API error (${res.status}).` };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Could not reach Telegram.' };
  }
}