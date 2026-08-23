import { Schema, model, models, Model, Types } from 'mongoose';
import type { CategoryType } from '@/types';

export interface ICategory {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: CategoryType;
  icon: string;
  isDefault: boolean;
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
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const Category: Model<ICategory> =
  models.Category || model<ICategory>('Category', CategorySchema);

export default Category;
