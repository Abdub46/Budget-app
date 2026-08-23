import { Resend } from 'resend';
import { formatCurrency } from '@/lib/utils';
import { reportEmailSubject } from '@/lib/pdf/filename';
import type { IReport } from '@/models/Report';

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      'RESEND_API_KEY is not configured. Add it to your .env.local file to enable emailed reports.'
    );
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendMonthlyReportEmail(params: {
  to: string;
  userName: string;
  month: number;
  currency: string;
  filename: string;
  pdfBuffer: Buffer;
  snapshot: IReport['snapshot'];
}) {
  const { to, userName, month, currency, filename, pdfBuffer, snapshot } = params;
  const client = getResendClient();
  const from = process.env.EMAIL_FROM || 'Budget <reports@budget.app>';
  const monthName = reportEmailSubject(month);

  const firstName = userName.split(' ')[0];

  const html = `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a2e;">
      <p style="font-size: 16px;">Hi ${firstName},</p>
      <p style="font-size: 15px; line-height: 1.6;">Your ${monthName} is ready.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Budget</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 14px;">${formatCurrency(snapshot.totalBudget, currency)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Expenses</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 14px;">${formatCurrency(snapshot.totalExpenses, currency)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Remaining</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 14px;">${formatCurrency(snapshot.remaining, currency)}</td>
        </tr>
      </table>
      <p style="font-size: 14px; color: #6b7280;">Your complete report is attached.</p>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
        This email was sent because monthly reports are enabled in your Budget settings.
        You can turn them off anytime under Settings → Monthly Reports.
      </p>
    </div>
  `;

  await client.emails.send({
    from,
    to,
    subject: monthName,
    html,
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });
}
