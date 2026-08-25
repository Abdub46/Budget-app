'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle2, PlusCircle, Eye, EyeOff, Target } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { BudgetGroupBreakdownEntry } from '@/lib/budget-groups';

interface MonthlyStatusCardProps {
  label: string;
  currency: string;
  hasBudget: boolean;
  totalBudget?: number;
  averageMonthlyBudget: number;
  comparison?: { status: 'above' | 'below' | 'equal'; absDiff: number; percent: number };
  budgetGroups?: BudgetGroupBreakdownEntry[];
}

const STATUS_CONFIG = {
  above: {
    icon: TrendingUp,
    badge: 'bg-warning-light text-warning-dark',
    text: 'above average',
  },
  below: {
    icon: TrendingDown,
    badge: 'bg-primary-100 text-primary-700',
    text: 'below average',
  },
  equal: {
    icon: CheckCircle2,
    badge: 'bg-success-light text-success-dark',
    text: 'at average',
  },
};

export default function MonthlyStatusCard({
  label,
  currency,
  hasBudget,
  totalBudget,
  averageMonthlyBudget,
  comparison,
  budgetGroups,
}: MonthlyStatusCardProps) {
  const [isHidden, setIsHidden] = useState(false);

  if (!hasBudget) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No budget recorded for <span className="font-medium text-foreground">{label}</span>.
        </p>
        <Link href="/budget">
          <Button className="mt-4" size="sm">
            <PlusCircle className="h-3.5 w-3.5" />
            Set up this month&apos;s budget
          </Button>
        </Link>
      </div>
    );
  }

  const { icon: Icon, badge, text } = STATUS_CONFIG[comparison!.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 p-6 shadow-card"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} Budget
      </p>
      <div className="mt-1 flex items-center gap-2">
        <p className="text-3xl font-semibold text-foreground tabular-nums">
          {isHidden ? '••••••' : formatCurrency(totalBudget ?? 0, currency)}
        </p>
        <button
          type="button"
          onClick={() => setIsHidden((v) => !v)}
          aria-label={isHidden ? 'Show budget amount' : 'Hide budget amount'}
          aria-pressed={isHidden}
          className="rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {isHidden ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badge}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {comparison!.status === 'equal'
            ? 'At Average'
            : `${formatCurrency(comparison!.absDiff, currency)} ${text}`}
        </span>
        {comparison!.status !== 'equal' && (
          <span className="text-xs text-muted-foreground">
            {formatPercent(comparison!.percent)} {text}
          </span>
        )}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Average monthly budget: {formatCurrency(averageMonthlyBudget, currency)}
      </p>

      {budgetGroups && budgetGroups.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Your Budget Allocation
          </p>
          {(() => {
            const belowTarget = budgetGroups.filter((g) => g.status === 'below');
            if (belowTarget.length === 0) {
              return (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  All categories have reached their target ratio.
                </p>
              );
            }
            return (
              <ul className="mt-2 space-y-1.5">
                {belowTarget.map((g) => (
                  <li key={g.key} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      {g.label}{' '}
                      <span className="text-foreground font-medium">
                        ({formatPercent(g.actualPercent)} of {g.targetPercent}%)
                      </span>
                    </span>
                    <span className="whitespace-nowrap font-medium text-warning-dark">
                      {formatCurrency(g.remainingToTarget, currency)} to go
                    </span>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      )}
    </motion.div>
  );
}

