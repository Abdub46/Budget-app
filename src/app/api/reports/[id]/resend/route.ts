import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Report, User } from '@/models';
import { jsonError, isValidObjectId, withErrorHandling } from '@/lib/api-helpers';
import { renderReportPDF } from '@/lib/reports';
import { sendMonthlyReportEmail } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid report ID.');

    const limitResult = await rateLimit(`report-resend:${userId}`, { limit: 5, windowMs: 60_000 });
    if (!limitResult.success) {
      return jsonError(429, 'Please wait a moment before resending another report.');
    }

    await connectDB();

    const [report, user] = await Promise.all([
      Report.findOne({ _id: params.id, userId }),
      User.findById(userId).select('name email currency').lean(),
    ]);
    if (!report) return jsonError(404, 'Report not found.');
    if (!user) return jsonError(404, 'User not found.');

    const pdfBuffer = await renderReportPDF(userId, report);

    await sendMonthlyReportEmail({
      to: user.email,
      userName: user.name,
      month: report.month,
      currency: user.currency,
      filename: report.filename,
      pdfBuffer,
      snapshot: report.snapshot,
    });

    report.emailSent = true;
    report.sentAt = new Date();
    await report.save();

    return NextResponse.json({ report, message: 'Report resent.' });
  });
}
