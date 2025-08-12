'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltipContent } from '../ui/chart';

const data = [
  { quarter: 'Q1', actual: 45, predicted: 40 },
  { quarter: 'Q2', actual: 62, predicted: 58 },
  { quarter: 'Q3', actual: 75, predicted: 70 },
  { quarter: 'Q4', actual: 90, predicted: 88 },
  { quarter: 'Q1 (Next)', predicted: 95 },
  { quarter: 'Q2 (Next)', predicted: 110 },
];

export function PredictiveHiresChart() {
  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="quarter"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1.5, strokeDasharray: '3 3' }}
            content={<ChartTooltipContent />}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
