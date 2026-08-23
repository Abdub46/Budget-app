'use client';

import { motion } from 'framer-motion';
import {
  Wallet, Receipt, PiggyBank, TrendingUp, TrendingDown,
  ArrowUpCircle, ArrowDownCircle, Scale,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_LABELS } from '@/lib/category-colors';
import type { CategoryType } from '@/types';

interface SummaryStatsProps {
  currency: string;
  totalBudget: number;
  totalExpenses: number;
  remaining: number;
  totalSavings: number;
  totalInvestments: number;
  highestCategory: { category: CategoryType; amount: number } | null;
  lowestCategory: { category: CategoryType; amount: number } | null;
  averageMonthlyBudget: number;
  averageActualBudget: number;
}

export default function SummaryStats({
  currency,
  totalBudget,
  totalExpenses,
  remaining,
  totalSavings,
  totalInvestments,
  highestCategory,
  lowestCategory,
  averageMonthlyBudget,
  averageActualBudget,
}: SummaryStatsProps) {
  const stats = [
    { label: 'Total Budget', value: formatCurrency(totalBudget, currency), icon: Wallet },
    { label: 'Total Expenses', value: formatCurrency(totalExpenses, currency), icon: Receipt },
    {
      label: 'Remaining',
      value: formatCurrency(remaining, currency),
      icon: Scale,
      negative: remaining < 0,
    },
    {
      label: 'Savings & Investments',
      value: formatCurrency(totalSavings + totalInvestments, currency),
      icon: PiggyBank,
    },
    {
      label: 'Highest Spending Category',
      value: highestCategory ? CATEGORY_LABELS[highestCategory.category] : '—',
      sub: highestCategory ? formatCurrency(highestCategory.amount, currency) : undefined,
      icon: ArrowUpCircle,
    },
    {
      label: 'Lowest Spending Category',
      value: lowestCategory ? CATEGORY_LABELS[lowestCategory.category] : '—',
      sub: lowestCategory ? formatCurrency(lowestCategory.amount, currency) : undefined,
      icon: ArrowDownCircle,
    },
    {
      label: 'Average Monthly Budget',
      value: formatCurrency(averageMonthlyBudget, currency),
      sub: 'Your registered baseline',
      icon: TrendingUp,
    },
    {
      label: 'Average Actual Budget',
      value: formatCurrency(averageActualBudget, currency),
      sub: 'Across the selected period',
      icon: TrendingDown,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <stat.icon className="h-3.5 w-3.5" />
            <span className="text-xs">{stat.label}</span>
          </div>
          <p
            className={`mt-2 text-lg font-semibold truncate ${
              (stat as any).negative ? 'text-danger' : 'text-foreground'
            }`}
          >
            {stat.value}
          </p>
          {stat.sub && <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>}
        </motion.div>
      ))}
    </div>
  );
}
