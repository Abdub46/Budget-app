import { Schema, model, models, Model, Types } from 'mongoose';

export interface IBudgetAddition {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  budgetId: Types.ObjectId;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetAdditionSchema = new Schema<IBudgetAddition>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: 'MonthlyBudget',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    description: { type: String, trim: true, maxlength: 240 },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

BudgetAdditionSchema.index({ userId: 1, budgetId: 1, date: -1 });

const BudgetAddition: Model<IBudgetAddition> =
  models.BudgetAddition || model<IBudgetAddition>('BudgetAddition', BudgetAdditionSchema);

export default BudgetAddition;
