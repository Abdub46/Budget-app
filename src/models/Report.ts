import { Schema, model, models, Model, Types } from 'mongoose';

export interface IReport {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  month: number;
  year: number;
  filename: string; // e.g. "August Budget Summary.pdf"
  emailSent: boolean;
  generatedAt: Date;
  sentAt?: Date;
  // Snapshot of the figures used to build the PDF, so "View" always reflects
  // exactly what was sent — even if later expenses are edited retroactively.
  snapshot: {
    initialBudget: number;
    additionalBudget: number;
    totalBudget: number;
    totalExpenses: number;
    remaining: number;
    utilizationPercent: number;
    averageMonthlyBudget: number;
    comparisonStatus: 'above' | 'below' | 'equal';
    comparisonAmount: number;
    comparisonPercent: number;
    categoryBreakdown: Array<{ category: string; amount: number }>;
    highestCategory?: { category: string; amount: number };
    lowestCategory?: { category: string; amount: number };
    totalSavings: number;
    totalInvestments: number;
    savingsDestinations: string[];
    insights: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    filename: { type: String, required: true },
    emailSent: { type: Boolean, default: false },
    generatedAt: { type: Date, required: true, default: Date.now },
    sentAt: { type: Date },
    snapshot: {
      initialBudget: { type: Number, required: true },
      additionalBudget: { type: Number, required: true },
      totalBudget: { type: Number, required: true },
      totalExpenses: { type: Number, required: true },
      remaining: { type: Number, required: true },
      utilizationPercent: { type: Number, required: true },
      averageMonthlyBudget: { type: Number, required: true },
      comparisonStatus: { type: String, enum: ['above', 'below', 'equal'], required: true },
      comparisonAmount: { type: Number, required: true },
      comparisonPercent: { type: Number, required: true },
      categoryBreakdown: [
        {
          category: String,
          amount: Number,
          _id: false,
        },
      ],
      highestCategory: {
        category: String,
        amount: Number,
        _id: false,
      },
      lowestCategory: {
        category: String,
        amount: Number,
        _id: false,
      },
      totalSavings: { type: Number, required: true, default: 0 },
      totalInvestments: { type: Number, required: true, default: 0 },
      savingsDestinations: [{ type: String }],
      insights: [{ type: String }],
    },
  },
  { timestamps: true }
);

// Prevents duplicate monthly reports for the same user/month/year.
ReportSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

const Report: Model<IReport> = models.Report || model<IReport>('Report', ReportSchema);

export default Report;
