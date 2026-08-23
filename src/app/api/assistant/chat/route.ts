import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { aiChatSchema } from '@/lib/validations';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/rate-limit';
import { getFinancialContext } from '@/lib/ai-context';
import { getAssistantReply } from '@/lib/ai-client';

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    // Modest per-user rate limit — chat calls hit a paid AI API.
    const limitResult = await rateLimit(`assistant-chat:${userId}`, { limit: 20, windowMs: 60_000 });
    if (!limitResult.success) {
      return jsonError(429, 'You\u2019re sending messages too quickly. Please slow down.');
    }

    const body = await req.json();
    const parsed = aiChatSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    // Context is built strictly from this authenticated user's ID — the AI
    // never sees another user's records, and never receives the raw DB.
    const context = await getFinancialContext(userId);

    let reply: string;
    try {
      reply = await getAssistantReply(parsed.data.messages, context);
    } catch (err: any) {
      if (err?.message?.includes('AI_API_KEY')) {
        return jsonError(503, 'The AI Financial Assistant is not configured yet. Add an AI_API_KEY to enable it.');
      }
      throw err;
    }

    return NextResponse.json({ reply });
  });
}
