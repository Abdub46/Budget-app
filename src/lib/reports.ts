import { Types } from 'mongoose';
import { MonthlyBudget, Expense, Report, User } from '@/models';
import type { IReport } from '@/models/Report';
import { getFinancialContext } from '@/lib/ai-context';
import { generateInsights } from '@/lib/insights';
import { reportFilename } from '@/lib/pdf/filename';
import { renderMonthlyReportPDF } from '@/lib/pdf/render';
import { sendMonthlyReportEmail } from '@/lib/email';
import type { MonthYear } from '@/lib/period';

export class ReportError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Computes the figures snapshot for a single month. Throws if no budget
 * exists for that month — a report can't meaningfully summarize a month the
 * user never budgeted for.
 */
export async function buildReportSnapshot(
  userId: string | Types.ObjectId,
  target: MonthYear
): Promise<IReport['snapshot']> {
  const budget = await MonthlyBudget.findOne({ userId, month: target.month, year: target.year }).lean();
  if (!budget) {
    throw new ReportError(
      `No budget was recorded for that month, so a report can't be generated.`,
      404
    );
  }

  const context = await getFinancialContext(userId, target);
  const { currentMonth } = context;

  const savingsExpenses = await Expense.find({
    userId,
    date: {
      $gte: new Date(target.year, target.month - 1, 1),
      $lt: new Date(target.year, target.month, 1),
    },
    categoryType: { $in: ['savings', 'investment'] },
    destination: { $exists: true, $ne: '' },
  })
    .select('destination')
    .lean();

  const savingsDestinations = Array.from(
    new Set(savingsExpenses.map((e) => e.destination).filter(Boolean) as string[])
  );

  return {
    initialBudget: budget.initialAmount,
    additionalBudget: budget.totalAdditionalAmount,
    totalBudget: budget.totalBudget,
    totalExpenses: currentMonth.totalExpenses,
    remaining: currentMonth.remaining,
    utilizationPercent: Math.round(currentMonth.utilizationPercent * 10) / 10,
    averageMonthlyBudget: context.averageMonthlyBudget,
    comparisonStatus: currentMonth.comparisonToAverage.status,
    comparisonAmount: currentMonth.comparisonToAverage.absDiff,
    comparisonPercent: currentMonth.comparisonToAverage.percent,
    categoryBreakdown: currentMonth.categoryBreakdown,
    highestCategory: currentMonth.highestCategory ?? undefined,
    lowestCategory: currentMonth.lowestCategory ?? undefined,
    totalSavings: currentMonth.totalSavings,
    totalInvestments: currentMonth.totalInvestments,
    savingsDestinations,
    insights: generateInsights(context),
  };
}

/**
 * Creates the Report record for a month, idempotently. The unique
 * (userId, year, month) index on the Report model is the ultimate guard
 * against duplicates; this function checks first so callers get back the
 * existing report instead of a raw duplicate-key error.
 */
export async function generateMonthlyReport(
  userId: string | Types.ObjectId,
  target: MonthYear
) {
  const existing = await Report.findOne({ userId, month: target.month, year: target.year });
  if (existing) return existing;

  const snapshot = await buildReportSnapshot(userId, target);

  try {
    const report = await Report.create({
      userId,
      month: target.month,
      year: target.year,
      filename: reportFilename(target.month, target.year),
      emailSent: false,
      generatedAt: new Date(),
      snapshot,
    });
    return report;
  } catch (err: any) {
    // Race condition: another request created it between our check and create.
    if (err?.code === 11000) {
      const raceExisting = await Report.findOne({ userId, month: target.month, year: target.year });
      if (raceExisting) return raceExisting;
    }
    throw err;
  }
}

/**
 * Renders the PDF for an existing report from its stored snapshot (never
 * recomputed from live data), so a re-download or resend always matches
 * exactly what was originally generated.
 */
export async function renderReportPDF(userId: string | Types.ObjectId, report: IReport) {
  const user = await User.findById(userId).select('name currency').lean();
  if (!user) throw new ReportError('User not found.', 404);

  return renderMonthlyReportPDF({
    userName: user.name,
    currency: user.currency,
    month: report.month,
    year: report.year,
    snapshot: report.snapshot,
  });
}

/**
 * Full flow: ensure the report exists, render its PDF, email it (only if
 * the user has monthly reports enabled), and record that it was sent.
 */
export async function generateAndSendMonthlyReport(
  userId: string | Types.ObjectId,
  target: MonthYear,
  options: { forceEmail?: boolean } = {}
) {
  const user = await User.findById(userId).select('name email currency settings').lean();
  if (!user) throw new ReportError('User not found.', 404);

  const report = await generateMonthlyReport(userId, target);

  const shouldEmail = options.forceEmail || user.settings?.emailReportsEnabled !== false;
  if (!shouldEmail || report.emailSent) {
    return { report, emailSent: report.emailSent };
  }

  const pdfBuffer = await renderMonthlyReportPDF({
    userName: user.name,
    currency: user.currency,
    month: report.month,
    year: report.year,
    snapshot: report.snapshot,
  });

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

  return { report, emailSent: true };
}
