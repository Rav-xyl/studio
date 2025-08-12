'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChartTooltipContent } from '../ui/chart';

const data = [
  { name: 'Engineering', value: 400, fill: 'hsl(var(--chart-1))' },
  { name: 'Product', value: 300, fill: 'hsl(var(--chart-2))' },
  { name: 'Design', value: 300, fill: 'hsl(var(--chart-3))' },
  { name: 'Data', value: 200, fill: 'hsl(var(--chart-4))' },
  { name: 'Marketing', value: 278, fill: 'hsl(var(--chart-5))' },
];

export function RoleDistributionChart() {
  return (
    <div className="h-[350px]">
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
    </div>
  );
}
