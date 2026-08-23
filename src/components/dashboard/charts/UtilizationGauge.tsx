'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import ChartCard from './ChartCard';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function UtilizationGauge({
  utilizationPercent,
  totalBudget,
  totalExpenses,
  currency,
}: {
  utilizationPercent: number;
  totalBudget: number;
  totalExpenses: number;
  currency: string;
}) {
  const clamped = Math.min(Math.max(utilizationPercent, 0), 100);
  const overBudget = utilizationPercent > 100;
  const data = [{ name: 'Utilization', value: clamped, fill: overBudget ? '#dc2626' : '#2563eb' }];

  return (
    <ChartCard
      title="Budget Utilization"
      accessibleSummary={`${formatPercent(utilizationPercent)} of the budget has been used: ${formatCurrency(
        totalExpenses,
        currency
      )} spent of ${formatCurrency(totalBudget, currency)}.`}
    >
      <div className="h-56 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={16}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background dataKey="value" cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-foreground">{formatPercent(utilizationPercent)}</span>
          <span className="text-xs text-muted-foreground">used</span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs">
        {overBudget ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 text-danger" />
            <span className="text-danger">
              Over budget by {formatCurrency(totalExpenses - totalBudget, currency)}
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            <span className="text-muted-foreground">
              {formatCurrency(Math.max(totalBudget - totalExpenses, 0), currency)} remaining
            </span>
          </>
        )}
      </div>
    </ChartCard>
  );
}
