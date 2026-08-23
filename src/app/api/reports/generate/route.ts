import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { jsonError, withErrorHandling } from '@/lib/api-helpers';
import { generateAndSendMonthlyReport, ReportError } from '@/lib/reports';
import { rateLimit } from '@/lib/rate-limit';

const bodySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();

    // PDF rendering + email sending are relatively expensive — guard against abuse.
    const limitResult = rateLimit(`report-generate:${userId}`, { limit: 10, windowMs: 60_000 });
    if (!limitResult.success) {
      return jsonError(429, 'Please wait a moment before generating another report.');
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'Validation failed', { issues: parsed.error.flatten().fieldErrors });
    }

    await connectDB();

    try {
      const { report, emailSent } = await generateAndSendMonthlyReport(userId, parsed.data);
      return NextResponse.json({ report, emailSent }, { status: 201 });
    } catch (err) {
      if (err instanceof ReportError) return jsonError(err.status, err.message);
      throw err;
    }
  });
}
