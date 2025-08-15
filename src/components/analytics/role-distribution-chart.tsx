
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';


const data: any[] = [
  // Data will be populated dynamically in a real application
];

const chartConfig = {
  value: {
    label: 'Hires',
  },
  engineering: {
    label: 'Engineering',
    color: 'hsl(var(--chart-1))',
  },
  product: {
    label: 'Product',
    color: 'hsl(var(--chart-2))',
  },
  design: {
    label: 'Design',
    color: 'hsl(var(--chart-3))',
  },
  data: {
    label: 'Data',
    color: 'hsl(var(--chart-4))',
  },
  marketing: {
    label: 'Marketing',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;


export function RoleDistributionChart() {
  return (
    <div className="h-[350px]">
      {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No data available to display chart.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              dataKey="value"
              nameKey="name"
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                value,
                index,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = 25 + innerRadius + (outerRadius - innerRadius);
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="hsl(var(--foreground))"
                    textAnchor={x > cx ? 'start' : 'end'}
                    dominantBaseline="central"
                    className="text-xs"
                  >
                    {data[index].name} ({value})
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
      )}
    </div>
  );
}
