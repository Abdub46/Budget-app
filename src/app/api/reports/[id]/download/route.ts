import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireUserId } from '@/lib/session';
import { Report } from '@/models';
import { jsonError, isValidObjectId, withErrorHandling } from '@/lib/api-helpers';
import { renderReportPDF } from '@/lib/reports';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const userId = await requireUserId();
    if (!isValidObjectId(params.id)) return jsonError(400, 'Invalid report ID.');

    await connectDB();

    const report = await Report.findOne({ _id: params.id, userId });
    if (!report) return jsonError(404, 'Report not found.');

    const pdfBuffer = await renderReportPDF(userId, report);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.filename}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  });
}
