import { Schema, model, models, Model, Types } from 'mongoose';

export interface IMonthlyBudget {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  month: number; // 1-12
  year: number;
  initialAmount: number; // never overwritten after creation
  totalAdditionalAmount: number; // denormalized sum of BudgetAddition amounts
  totalBudget: number; // initialAmount + totalAdditionalAmount, kept in sync
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyBudgetSchema = new Schema<IMonthlyBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    initialAmount: { type: Number, required: true, min: 0 },
    totalAdditionalAmount: { type: Number, required: true, min: 0, default: 0 },
    totalBudget: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// One budget per user per month/year. Also the primary lookup pattern.
MonthlyBudgetSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

MonthlyBudgetSchema.pre('validate', function (next) {
  // totalBudget is always derived — this guarantees it can never silently drift.
  this.totalBudget = (this.initialAmount ?? 0) + (this.totalAdditionalAmount ?? 0);
  next();
});

const MonthlyBudget: Model<IMonthlyBudget> =
  models.MonthlyBudget || model<IMonthlyBudget>('MonthlyBudget', MonthlyBudgetSchema);

export default MonthlyBudget;
