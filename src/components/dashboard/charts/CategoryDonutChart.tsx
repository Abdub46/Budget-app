'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/category-colors';
import type { CategoryBreakdownEntry } from '@/lib/analytics';

export default function CategoryDonutChart({
  data,
  currency,
}: {
  data: CategoryBreakdownEntry[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Expense Distribution by Category">
        <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
          No expenses recorded for this period.
        </div>
      </ChartCard>
    );
  }

  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category],
    value: d.amount,
    color: CATEGORY_COLORS[d.category],
  }));

  return (
    <ChartCard
      title="Expense Distribution by Category"
      accessibleSummary={`Donut chart showing spending across ${data.length} categories: ${data
        .map((d) => `${CATEGORY_LABELS[d.category]} ${formatCurrency(d.amount, currency)}`)
        .join(', ')}.`}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="85%"
              paddingAngle={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
