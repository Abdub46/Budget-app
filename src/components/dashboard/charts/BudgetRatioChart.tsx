'use client';

import { CheckCircle2, AlertTriangle, TrendingDown } from 'lucide-react';
import ChartCard from './ChartCard';
import { formatCurrency, formatPercent } from '@/lib/utils';
import type { BudgetGroupBreakdownEntry, BudgetGroupStatus } from '@/lib/budget-groups';

const STATUS_STYLES: Record<
  BudgetGroupStatus,
  { barColor: string; badge: string; icon: typeof CheckCircle2; text: string }
> = {
  below: {
    barColor: 'bg-primary',
    badge: 'bg-primary-100 text-primary-700',
    icon: TrendingDown,
    text: 'Below target',
  },
  reached: {
    barColor: 'bg-success',
    badge: 'bg-success-light text-success-dark',
    icon: CheckCircle2,
    text: 'On target',
  },
  exceeded: {
    barColor: 'bg-danger',
    badge: 'bg-danger-light text-danger-dark',
    icon: AlertTriangle,
    text: 'Exceeded',
  },
};

export default function BudgetRatioChart({
  data,
  currency,
}: {
  data: BudgetGroupBreakdownEntry[];
  currency: string;
}) {
  const accessibleSummary = data
    .map(
      (g) =>
        `${g.label}: ${formatPercent(g.actualPercent)} of a ${g.targetPercent}% target, ${
          g.status
        }${g.status === 'below' ? `, ${formatCurrency(g.remainingToTarget, currency)} remaining to reach target` : ''}.`
    )
    .join(' ');

  return (
    <ChartCard title="Budget Ratio (Your Allocation)" accessibleSummary={accessibleSummary}>
      <div className="space-y-5">
        {data.map((group) => {
          const { barColor, badge, icon: Icon, text } = STATUS_STYLES[group.status];
          const fillWidth = Math.min(group.actualPercent, 100);
          const targetPosition = Math.min(group.targetPercent, 100);

          return (
            <div key={group.key}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-sm font-medium text-foreground">
                  {group.label}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    · Target {group.targetPercent}%
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge}`}
                >
                  <Icon className="h-3 w-3" />
                  {text}
                </span>
              </div>

              <div className="relative mt-2 h-2.5 w-full rounded-full bg-muted">
                <div
                  className={`h-2.5 rounded-full ${barColor} transition-all`}
                  style={{ width: `${fillWidth}%` }}
                />
                {/* Target marker: a thin vertical line at the target percentage */}
                <div
                  className="absolute top-0 h-2.5 w-0.5 bg-foreground/50"
                  style={{ left: `${targetPosition}%` }}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  {formatPercent(group.actualPercent)} used ·{' '}
                  {formatCurrency(group.actualAmount, currency)} of{' '}
                  {formatCurrency(group.targetAmount, currency)} target
                </span>
                {group.status === 'below' && (
                  <span className="font-medium text-warning-dark">
                    {formatCurrency(group.remainingToTarget, currency)} to reach target
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}