'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/category-colors';
import type { CategoryBreakdownEntry } from '@/lib/analytics';

export default function CategoryHorizontalBarChart({
  data,
  currency,
}: {
  data: CategoryBreakdownEntry[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <ChartCard title="Spending by Category, Ranked">
        <div className="h-72 flex items-center justify-center text-sm text-muted-foreground">
          No expenses recorded for this period.
        </div>
      </ChartCard>
    );
  }

  const chartData = [...data]
    .sort((a, b) => b.amount - a.amount)
    .map((d) => ({ name: CATEGORY_LABELS[d.category], value: d.amount, color: CATEGORY_COLORS[d.category] }));

  return (
    <ChartCard
      title="Spending by Category, Ranked"
      accessibleSummary={`Horizontal bar chart ranking categories from highest to lowest spend: ${chartData
        .map((d) => `${d.name} ${formatCurrency(d.value, currency)}`)
        .join(', ')}.`}
    >
      <div style={{ height: Math.max(200, chartData.length * 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v) => formatCompactNumber(v)}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
