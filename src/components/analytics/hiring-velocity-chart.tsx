
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';

const data = [
  { month: 'Jan', uploaded: 120, screening: 90, interview: 60, hired: 20 },
  { month: 'Feb', uploaded: 130, screening: 100, interview: 70, hired: 25 },
  { month: 'Mar', uploaded: 150, screening: 110, interview: 80, hired: 30 },
  { month: 'Apr', uploaded: 140, screening: 120, interview: 90, hired: 35 },
  { month: 'May', uploaded: 160, screening: 130, interview: 100, hired: 40 },
  { month: 'Jun', uploaded: 170, screening: 140, interview: 110, hired: 45 },
];

const chartConfig = {
  uploaded: {
    label: 'Uploaded',
    color: 'hsl(var(--chart-1))',
  },
  screening: {
    label: 'Screening',
    color: 'hsl(var(--chart-2))',
  },
  interview: {
    label: 'Interview',
    color: 'hsl(var(--chart-3))',
  },
  hired: {
    label: 'Hired',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function HiringVelocityChart() {
  return (
    <div className="h-[350px]">
       {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No data available to display chart.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--secondary))' }}
              content={<ChartTooltipContent />}
            />
            <Legend wrapperStyle={{fontSize: "12px"}} />
            <Bar dataKey="uploaded" fill="var(--color-uploaded)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="screening" fill="var(--color-screening)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="interview" fill="var(--color-interview)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="hired" fill="var(--color-hired)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
      )}
    </div>
  );
}
