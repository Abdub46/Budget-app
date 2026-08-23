import { Types } from 'mongoose';
import Category from '@/models/Category';
import { DEFAULT_CATEGORIES } from '@/types';

/**
 * Creates the standard category set for a new user. Safe to call multiple
 * times — uses insertMany with ordered:false so pre-existing categories
 * (matched by the unique userId+name index) are skipped rather than throwing.
 */
export async function provisionDefaultCategories(userId: Types.ObjectId | string) {
  const docs = DEFAULT_CATEGORIES.map((c) => ({
    userId,
    name: c.name,
    type: c.type,
    icon: c.icon,
    isDefault: true,
  }));

  try {
    await Category.insertMany(docs, { ordered: false });
  } catch {
    // Duplicate key errors are expected if some categories already exist —
    // insertMany with ordered:false still inserts the rest.
  }
}
