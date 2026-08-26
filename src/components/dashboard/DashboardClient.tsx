'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import PeriodSelector from '@/components/dashboard/PeriodSelector';
import MonthlyStatusCard from '@/components/dashboard/MonthlyStatusCard';
import SummaryStats from '@/components/dashboard/SummaryStats';
import BudgetExpenseLineChart from '@/components/dashboard/charts/BudgetExpenseLineChart';
import BudgetVsExpenseBarChart from '@/components/dashboard/charts/BudgetVsExpenseBarChart';
import CategoryDonutChart from '@/components/dashboard/charts/CategoryDonutChart';
import CategoryHorizontalBarChart from '@/components/dashboard/charts/CategoryHorizontalBarChart';
import SavingsAreaChart from '@/components/dashboard/charts/SavingsAreaChart';
import UtilizationGauge from '@/components/dashboard/charts/UtilizationGauge';
import BudgetRatioChart from '@/components/dashboard/charts/BudgetRatioChart';
import BudgetStrategyCard, { type BudgetStrategy } from '@/components/dashboard/BudgetStrategyCard';
import BudgetHealthCard, { type BudgetHealth } from '@/components/dashboard/BudgetHealthCard';
import type { PeriodPreset } from '@/types';
import type { CategoryBreakdownEntry, MonthlySeriesPoint } from '@/lib/analytics';
import type { BudgetGroupBreakdownEntry } from '@/lib/budget-groups';

interface SummaryResponse {
  period: { preset: PeriodPreset; label: string };
  currency: string;
  averageMonthlyBudget: number;
  totalBudget: number;
  totalExpenses: number;
  remaining: number;
  totalSavings: number;
  totalInvestments: number;
  categoryBreakdown: CategoryBreakdownEntry[];
  highestCategory: CategoryBreakdownEntry | null;
  lowestCategory: CategoryBreakdownEntry | null;
  averageActualBudget: number;
  monthlySeries: MonthlySeriesPoint[];
  utilizationPercent: number;
  budgetGroups: BudgetGroupBreakdownEntry[];
  budgetHealth: BudgetHealth;
  budgetStrategy: BudgetStrategy;
}

interface CurrentMonthResponse {
  label: string;
  currency: string;
  hasBudget: boolean;
  totalBudget?: number;
  averageMonthlyBudget: number;
  comparison?: { status: 'above' | 'below' | 'equal'; absDiff: number; percent: number };
  budgetGroups?: BudgetGroupBreakdownEntry[];
  budgetStrategy?: BudgetStrategy;
}

export default function DashboardClient() {
  const { data: session } = useSession();
  const fullName = session?.user?.name ?? undefined;

  const [greeting, setGreeting] = useState('Welcome back');
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  const [preset, setPreset] = useState<PeriodPreset>('current-month');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [currentMonth, setCurrentMonth] = useState<CurrentMonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<BudgetStrategy | null>(null);

  const loadCurrentMonth = useCallback(async () => {
    const res = await fetch('/api/analytics/current-month');
    const result = await res.json();
    if (res.ok) {
      setCurrentMonth(result);
      if (result.budgetStrategy) setStrategy(result.budgetStrategy);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: preset });
      if (preset === 'custom' && customRange) {
        const [fromYear, fromMonth] = customRange.from.split('-');
        const [toYear, toMonth] = customRange.to.split('-');
        params.set('fromMonth', fromMonth);
        params.set('fromYear', fromYear);
        params.set('toMonth', toMonth);
        params.set('toYear', toYear);
      }

      const res = await fetch(`/api/analytics/summary?${params.toString()}`);
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Could not load dashboard analytics.');
        return;
      }
      setSummary(result);
    } finally {
      setLoading(false);
    }
  }, [preset, customRange]);

  useEffect(() => {
    loadCurrentMonth();
  }, [loadCurrentMonth]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handlePeriodChange: React.ComponentProps<typeof PeriodSelector>['onChange'] = (
    newPreset,
    custom
  ) => {
    setPreset(newPreset);
    setCustomRange(custom ?? null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{greeting}</h1>
          {fullName && (
            <p className="text-sm text-muted-foreground mt-0.5">{fullName}</p>
          )}
        </div>
        <PeriodSelector preset={preset} onChange={handlePeriodChange} />
      </div>

      {currentMonth && (
        <MonthlyStatusCard
          label={currentMonth.label}
          currency={currentMonth.currency}
          hasBudget={currentMonth.hasBudget}
          totalBudget={currentMonth.totalBudget}
          averageMonthlyBudget={currentMonth.averageMonthlyBudget}
          comparison={currentMonth.comparison}
          budgetGroups={currentMonth.budgetGroups}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-5 items-start">
        {strategy && (
          <div className="lg:col-span-2">
            <BudgetStrategyCard strategy={strategy} onUpdated={setStrategy} readOnly />
          </div>
        )}
        {summary?.budgetHealth && <BudgetHealthCard health={summary.budgetHealth} />}
      </div>

      {loading && !summary ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <>
          <SummaryStats
            currency={summary.currency}
            totalBudget={summary.totalBudget}
            totalExpenses={summary.totalExpenses}
            remaining={summary.remaining}
            totalSavings={summary.totalSavings}
            totalInvestments={summary.totalInvestments}
            highestCategory={summary.highestCategory}
            lowestCategory={summary.lowestCategory}
            averageMonthlyBudget={summary.averageMonthlyBudget}
            averageActualBudget={summary.averageActualBudget}
          />

          <div className="grid lg:grid-cols-2 gap-5">
            <BudgetExpenseLineChart data={summary.monthlySeries} currency={summary.currency} />
            <BudgetVsExpenseBarChart data={summary.monthlySeries} currency={summary.currency} />
            <CategoryDonutChart data={summary.categoryBreakdown} currency={summary.currency} />
            <CategoryHorizontalBarChart data={summary.categoryBreakdown} currency={summary.currency} />
            <SavingsAreaChart data={summary.monthlySeries} currency={summary.currency} />
            <UtilizationGauge
              utilizationPercent={summary.utilizationPercent}
              totalBudget={summary.totalBudget}
              totalExpenses={summary.totalExpenses}
              currency={summary.currency}
            />
            <div className="lg:col-span-2">
              <BudgetRatioChart data={summary.budgetGroups} currency={summary.currency} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
