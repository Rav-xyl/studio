'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';

const data: any[] = [
  // Data will be populated dynamically
];

const chartConfig = {
  actual: {
    label: 'Actual Hires',
    color: 'hsl(var(--foreground))',
  },
  predicted: {
    label: 'Predicted Hires',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;


export function PredictiveHiresChart() {
  return (
    <div className="h-[350px]">
       {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No data available to display chart.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="w-full h-full">
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
              stroke="var(--color-actual)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-predicted)"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      )}
    </div>
  );
}
