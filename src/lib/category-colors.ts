import type { CategoryType } from '@/types';

export const CATEGORY_LABELS: Record<CategoryType, string> = {
  food: 'Food',
  transport: 'Transport',
  rent: 'Rent',
  utilities: 'Utilities',
  savings: 'Savings',
  investment: 'Investment',
  entertainment: 'Entertainment',
  health: 'Health',
  education: 'Education',
  shopping: 'Shopping',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<CategoryType, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  rent: '#8b5cf6',
  utilities: '#06b6d4',
  savings: '#16a34a',
  investment: '#14b8a6',
  entertainment: '#ec4899',
  health: '#ef4444',
  education: '#eab308',
  shopping: '#a855f7',
  other: '#64748b',
};
