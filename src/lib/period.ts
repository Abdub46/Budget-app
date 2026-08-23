import type { PeriodPreset } from '@/types';
import { monthLabel } from '@/lib/utils';

export interface MonthYear {
  month: number; // 1-12
  year: number;
}

export interface PeriodRange {
  start: MonthYear;
  end: MonthYear;
  label: string;
}

export function toYearMonth({ month, year }: MonthYear): number {
  return year * 12 + (month - 1);
}

export function fromYearMonth(ym: number): MonthYear {
  const year = Math.floor(ym / 12);
  const month = (ym % 12) + 1;
  return { month, year };
}

export function shiftMonths({ month, year }: MonthYear, delta: number): MonthYear {
  return fromYearMonth(toYearMonth({ month, year }) + delta);
}

/**
 * Enumerates every {month, year} pair between start and end (inclusive).
 */
export function enumerateMonths(start: MonthYear, end: MonthYear): MonthYear[] {
  const startYm = toYearMonth(start);
  const endYm = toYearMonth(end);
  const months: MonthYear[] = [];
  for (let ym = startYm; ym <= endYm; ym++) {
    months.push(fromYearMonth(ym));
  }
  return months;
}

export function resolvePeriod(
  preset: PeriodPreset,
  now: MonthYear,
  options: {
    firstBudgetMonth?: MonthYear | null;
    customFrom?: MonthYear;
    customTo?: MonthYear;
  } = {}
): PeriodRange {
  switch (preset) {
    case 'current-month':
      return { start: now, end: now, label: monthLabel(now.month, now.year) };

    case 'previous-month': {
      const prev = shiftMonths(now, -1);
      return { start: prev, end: prev, label: monthLabel(prev.month, prev.year) };
    }

    case 'last-3-months': {
      const start = shiftMonths(now, -2);
      return { start, end: now, label: `${monthLabel(start.month, start.year)} — ${monthLabel(now.month, now.year)}` };
    }

    case 'last-6-months': {
      const start = shiftMonths(now, -5);
      return { start, end: now, label: `${monthLabel(start.month, start.year)} — ${monthLabel(now.month, now.year)}` };
    }

    case 'last-12-months': {
      const start = shiftMonths(now, -11);
      return { start, end: now, label: `${monthLabel(start.month, start.year)} — ${monthLabel(now.month, now.year)}` };
    }

    case 'all-months': {
      const start = options.firstBudgetMonth ?? now;
      return { start, end: now, label: `${monthLabel(start.month, start.year)} — ${monthLabel(now.month, now.year)}` };
    }

    case 'custom': {
      const start = options.customFrom ?? now;
      const end = options.customTo ?? now;
      return { start, end, label: `${monthLabel(start.month, start.year)} — ${monthLabel(end.month, end.year)}` };
    }

    default:
      return { start: now, end: now, label: monthLabel(now.month, now.year) };
  }
}
