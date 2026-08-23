'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import ChartCard from './ChartCard';
import { formatCompactNumber, formatCurrency } from '@/lib/utils';
import type { MonthlySeriesPoint } from '@/lib/analytics';

export default function SavingsAreaChart({
  data,
  currency,
}: {
  data: MonthlySeriesPoint[];
  currency: string;
}) {
  return (
    <ChartCard
      title="Savings & Investments Over Time"
      accessibleSummary={`Area chart showing savings and investment contributions across ${data.length} months.`}
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
              </linearGradient>
            </defs>
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
              formatter={(value: number) => [formatCurrency(value, currency), 'Savings & Investments']}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="savingsInvestments"
              name="Savings & Investments"
              stroke="#16a34a"
              strokeWidth={2.5}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
