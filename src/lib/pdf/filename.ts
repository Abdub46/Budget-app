import { MONTH_NAMES } from '@/lib/utils';

export function reportFilename(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} Budget Summary.pdf`;
}

export function reportEmailSubject(month: number): string {
  return `${MONTH_NAMES[month - 1]} Budget Summary`;
}
