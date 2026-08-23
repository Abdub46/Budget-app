import { Schema, model, models, Model, Types } from 'mongoose';
import type { CategoryType, PaymentMethod } from '@/types';

export interface IExpense {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  categoryId: Types.ObjectId;
  categoryType: CategoryType; // denormalized for fast aggregation without a lookup
  destination?: string; // e.g. merchant, savings account, investment vehicle
  description?: string;
  paymentMethod: PaymentMethod;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    categoryType: {
      type: String,
      enum: [
        'food', 'transport', 'rent', 'utilities', 'savings', 'investment',
        'entertainment', 'health', 'education', 'shopping', 'other',
      ],
      required: true,
      index: true,
    },
    destination: { type: String, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 240 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'mobile-money', 'bank-transfer', 'other'],
      required: true,
      default: 'cash',
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Primary access patterns: list/paginate a user's expenses by date range,
// and aggregate a user's expenses by category within a date range.
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, categoryType: 1, date: -1 });

const Expense: Model<IExpense> = models.Expense || model<IExpense>('Expense', ExpenseSchema);

export default Expense;
