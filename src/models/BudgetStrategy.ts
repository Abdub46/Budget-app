import { Schema, model, models, Model, Types } from 'mongoose';

export type BudgetStrategySource = 'ai' | 'custom';
export type BudgetStrategyConfidence = 'high' | 'medium' | 'low';

export interface IBudgetStrategy {
  _id: Types.ObjectId;
  userId: Types.ObjectId;

  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;

  source: BudgetStrategySource; // 'ai' = engine-generated, 'custom' = user override
  reasoning: string; // plain-language explanation, always built from the user's real data
  confidence: BudgetStrategyConfidence;

  /** Only present for source: 'ai' — a short label of the primary driver (e.g. "high essential expenses"). */
  primaryDriver?: string;

  /** The percentages this replaced, if any — powers "changed from X/Y/Z to A/B/C" messaging. */
  previousNeedsPercent?: number;
  previousWantsPercent?: number;
  previousSavingsPercent?: number;
  changeReason?: string;

  isActive: boolean; // exactly one active strategy per user at a time
  generatedAt: Date;
  nextReviewAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const BudgetStrategySchema = new Schema<IBudgetStrategy>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    needsPercent: { type: Number, required: true, min: 0, max: 100 },
    wantsPercent: { type: Number, required: true, min: 0, max: 100 },
    savingsPercent: { type: Number, required: true, min: 0, max: 100 },

    source: { type: String, enum: ['ai', 'custom'], required: true, default: 'ai' },
    reasoning: { type: String, required: true, maxlength: 1000 },
    confidence: { type: String, enum: ['high', 'medium', 'low'], required: true, default: 'medium' },
    primaryDriver: { type: String, maxlength: 200 },

    previousNeedsPercent: { type: Number },
    previousWantsPercent: { type: Number },
    previousSavingsPercent: { type: Number },
    changeReason: { type: String, maxlength: 500 },

    isActive: { type: Boolean, default: true },
    generatedAt: { type: Date, required: true, default: Date.now },
    nextReviewAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Primary lookup: this user's currently active strategy.
BudgetStrategySchema.index({ userId: 1, isActive: 1 });
// History, most recent first.
BudgetStrategySchema.index({ userId: 1, generatedAt: -1 });

// The three percentages must always total 100 — enforced at the model layer
// so no code path (engine, override, or a future migration) can slip through
// with a set that doesn't add up.
BudgetStrategySchema.pre('validate', function (next) {
  const total = (this.needsPercent ?? 0) + (this.wantsPercent ?? 0) + (this.savingsPercent ?? 0);
  if (Math.round(total) !== 100) {
    return next(new Error(`Budget allocation must total 100% (got ${total}%).`));
  }
  next();
});

const BudgetStrategy: Model<IBudgetStrategy> =
  models.BudgetStrategy || model<IBudgetStrategy>('BudgetStrategy', BudgetStrategySchema);

export default BudgetStrategy;
