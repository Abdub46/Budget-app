import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric amount as currency using the user's currency code.
 * Falls back gracefully for currency codes Intl may not fully localize (e.g. KES).
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KES',
  options?: { compact?: boolean; showSign?: boolean }
): string {
  const { compact = false, showSign = false } = options ?? {};

  try {
    const formatted = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 0,
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));

    const sign = amount < 0 ? '-' : showSign && amount > 0 ? '+' : '';
    return `${sign}${formatted}`;
  } catch {
    const sign = amount < 0 ? '-' : showSign && amount > 0 ? '+' : '';
    return `${sign}${currency} ${Math.abs(amount).toLocaleString()}`;
  }
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Computes the variance between an actual amount and a baseline (average) amount.
 * Returns the status, absolute difference, and percentage difference.
 */
export function computeBudgetComparison(actual: number, average: number) {
  const diff = actual - average;
  const absDiff = Math.abs(diff);
  const percent = average > 0 ? (absDiff / average) * 100 : 0;

  let status: 'above' | 'below' | 'equal';
  if (diff > 0) status = 'above';
  else if (diff < 0) status = 'below';
  else status = 'equal';

  return {
    status,
    diff,
    absDiff,
    percent: Math.round(percent * 10) / 10,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
