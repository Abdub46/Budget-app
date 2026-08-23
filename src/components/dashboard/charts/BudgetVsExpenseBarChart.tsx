'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import type { MonthlySeriesPoint } from '@/lib/analytics';

export default function BudgetVsExpenseBarChart({
  data,
  currency,
}: {
  data: MonthlySeriesPoint[];
  currency: string;
}) {
  return (
    <ChartCard
      title="Monthly Budget vs. Expenses"
      accessibleSummary={`Bar chart comparing monthly budget and expense totals across ${data.length} months.`}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCompactNumber(v)}
              width={48}
            />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
              }}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="budget" name="Budget" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
