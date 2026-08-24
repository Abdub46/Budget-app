import { Schema, model, models, Model, Types } from 'mongoose';
import type { CategoryType } from '@/types';

export interface ICategory {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: CategoryType;
  icon: string;
  isDefault: boolean;
  /**
   * Which 50/30/20 group this category counts toward (Settings → Budget
   * Ratio). `undefined` (never customized) falls back to a default mapping
   * by `type`; explicitly `null` means the user intentionally removed it
   * from any group — see src/lib/budget-groups.ts `effectiveBudgetGroup`.
   */
  budgetGroup?: 'needs' | 'wants' | 'savings' | null;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    type: {
      type: String,
      enum: [
        'food', 'transport', 'rent', 'utilities', 'savings', 'investment',
        'entertainment', 'health', 'education', 'shopping', 'other',
      ],
      required: true,
    },
    icon: { type: String, required: true, default: 'circle' },
    isDefault: { type: Boolean, default: false },
    budgetGroup: {
      type: String,
      enum: ['needs', 'wants', 'savings', null],
      default: undefined,
    },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const Category: Model<ICategory> =
  models.Category || model<ICategory>('Category', CategorySchema);

export default Category;
