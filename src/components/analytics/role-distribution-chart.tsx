
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import type { Candidate } from '@/lib/types';
import { useMemo } from 'react';

const chartConfig = {
  value: {
    label: 'Hires',
  },
  // Colors will be assigned dynamically
} satisfies ChartConfig;

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


interface RoleDistributionChartProps {
    candidates: Candidate[];
}

export function RoleDistributionChart({ candidates }: RoleDistributionChartProps) {
    const data = useMemo(() => {
        const hiredCandidates = candidates.filter(c => c.status === 'Hired');
        if (hiredCandidates.length === 0) return [];
        
        const roleCounts = hiredCandidates.reduce((acc, candidate) => {
            const role = candidate.role || 'Unassigned';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(roleCounts).map(([name, value], index) => ({
            name,
            value,
            fill: COLORS[index % COLORS.length],
        }));

    }, [candidates]);


  return (
    <div className="h-[350px]">
      {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          Hire candidates to see role distribution.
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
