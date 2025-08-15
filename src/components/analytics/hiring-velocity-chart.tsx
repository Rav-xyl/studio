
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import type { Candidate } from '@/lib/types';
import { useMemo } from 'react';

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

interface HiringVelocityChartProps {
    candidates: Candidate[];
}

export function HiringVelocityChart({ candidates }: HiringVelocityChartProps) {
    const data = useMemo(() => {
        if (!candidates || candidates.length === 0) return [];
        
        // This is a simplified view. A real app would group by date (e.g., month).
        const counts = candidates.reduce((acc, candidate) => {
            const status = candidate.status.toLowerCase();
            if (status in acc) {
                acc[status]++;
            }
            return acc;
        }, { uploaded: 0, screening: 0, interview: 0, hired: 0 } as Record<string, number>);

        return [{
            month: 'Current Pool', // Simplified label
            uploaded: counts.uploaded,
            screening: counts.screening,
            interview: counts.interview,
            hired: counts.hired,
        }];
    }, [candidates]);


  return (
    <div className="h-[350px]">
       {data.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          Upload and process candidates to see velocity data.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
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
