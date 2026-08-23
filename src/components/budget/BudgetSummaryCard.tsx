'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Plus, PlusCircle } from 'lucide-react';
import { formatCurrency, formatPercent, monthLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface BudgetSummaryCardProps {
  month: number;
  year: number;
  currency: string;
  budget: {
    initialAmount: number;
    totalAdditionalAmount: number;
    totalBudget: number;
    remaining: number;
    utilizationPercent: number;
    comparison: { status: 'above' | 'below' | 'equal'; absDiff: number; percent: number };
  } | null;
  totalExpenses: number;
  onCreateBudget: () => void;
  onAddFunds: () => void;
}

const comparisonCopy: Record<
  'above' | 'below' | 'equal',
  { icon: typeof TrendingUp; label: string; tone: string }
> = {
  above: { icon: TrendingUp, label: 'above average', tone: 'text-warning' },
  below: { icon: TrendingDown, label: 'below average', tone: 'text-primary' },
  equal: { icon: Minus, label: 'at average', tone: 'text-muted-foreground' },
};

export default function BudgetSummaryCard({
  month,
  year,
  currency,
  budget,
  totalExpenses,
  onCreateBudget,
  onAddFunds,
}: BudgetSummaryCardProps) {
  if (!budget) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No budget set for <span className="font-medium text-foreground">{monthLabel(month, year)}</span> yet.
        </p>
        <Button className="mt-4" onClick={onCreateBudget}>
          <PlusCircle className="h-4 w-4" />
          Create {monthLabel(month, year)} budget
        </Button>
      </div>
    );
  }

  const { icon: ComparisonIcon, label, tone } = comparisonCopy[budget.comparison.status];
  const utilization = Math.min(budget.utilizationPercent, 100);
  const overBudget = budget.remaining < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {monthLabel(month, year)} Budget
          </p>
          <p className="mt-1 text-3xl font-semibold text-foreground">
            {formatCurrency(budget.totalBudget, currency)}
          </p>
          <div className={`mt-1.5 flex items-center gap-1.5 text-sm ${tone}`}>
            <ComparisonIcon className="h-4 w-4" />
            <span>
              {budget.comparison.status === 'equal'
                ? 'Matches your average monthly budget'
                : `${formatCurrency(budget.comparison.absDiff, currency)} ${label} (${formatPercent(budget.comparison.percent)})`}
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onAddFunds}>
          <Plus className="h-3.5 w-3.5" />
          Add funds
        </Button>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Metric label="Initial" value={formatCurrency(budget.initialAmount, currency)} />
        <Metric label="Additional" value={`+${formatCurrency(budget.totalAdditionalAmount, currency)}`} />
        <Metric label="Spent" value={formatCurrency(totalExpenses, currency)} />
        <Metric
          label="Remaining"
          value={formatCurrency(budget.remaining, currency)}
          negative={overBudget}
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Budget utilization</span>
          <span>{formatPercent(budget.utilizationPercent)}</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={budget.utilizationPercent} aria-valuemin={0} aria-valuemax={100}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${utilization}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={overBudget ? 'h-full bg-danger' : 'h-full bg-primary'}
          />
        </div>
        {overBudget && (
          <p className="mt-1.5 text-xs text-danger">
            You&apos;ve exceeded this month&apos;s budget by {formatCurrency(Math.abs(budget.remaining), currency)}.
          </p>
        )}
      </div>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold ${negative ? 'text-danger' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  );
}
