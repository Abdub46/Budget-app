export type EmploymentStatus = 'employed' | 'self-employed' | 'student' | 'other';

export type IncomeStability = 'stable' | 'variable' | 'unstable';

export const INCOME_STABILITY_OPTIONS: Array<{ value: IncomeStability; label: string }> = [
  { value: 'stable', label: 'Stable — regular, predictable income' },
  { value: 'variable', label: 'Variable — income fluctuates month to month' },
  { value: 'unstable', label: 'Unstable — irregular or unreliable income' },
];

export type CategoryType =
  | 'food'
  | 'transport'
  | 'rent'
  | 'utilities'
  | 'savings'
  | 'investment'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'shopping'
  | 'other';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'mobile-money'
  | 'bank-transfer'
  | 'other';

export type BudgetComparisonStatus = 'above' | 'below' | 'equal';

export type PeriodPreset =
  | 'current-month'
  | 'previous-month'
  | 'last-3-months'
  | 'last-6-months'
  | 'last-12-months'
  | 'all-months'
  | 'custom';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  currency: string;
}

export const CURRENCIES = [
  { code: 'KES', label: 'Kenyan Shilling (KES)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'UGX', label: 'Ugandan Shilling (UGX)' },
  { code: 'TZS', label: 'Tanzanian Shilling (TZS)' },
  { code: 'NGN', label: 'Nigerian Naira (NGN)' },
  { code: 'ZAR', label: 'South African Rand (ZAR)' },
  { code: 'RWF', label: 'Rwandan Franc (RWF)' },
] as const;

export const DEFAULT_CATEGORIES: Array<{
  name: string;
  type: CategoryType;
  icon: string;
}> = [
  { name: 'Food', type: 'food', icon: 'utensils' },
  { name: 'Transport', type: 'transport', icon: 'car' },
  { name: 'Rent', type: 'rent', icon: 'home' },
  { name: 'Utilities', type: 'utilities', icon: 'plug' },
  { name: 'Savings', type: 'savings', icon: 'piggy-bank' },
  { name: 'Investment', type: 'investment', icon: 'trending-up' },
  { name: 'Entertainment', type: 'entertainment', icon: 'clapperboard' },
  { name: 'Health', type: 'health', icon: 'heart-pulse' },
  { name: 'Education', type: 'education', icon: 'graduation-cap' },
  { name: 'Shopping', type: 'shopping', icon: 'shopping-bag' },
  { name: 'Other', type: 'other', icon: 'more-horizontal' },
];
