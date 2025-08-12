'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ChartTooltipContent } from '../ui/chart';

const data = [
  { month: 'Jan', uploaded: 120, screening: 90, interview: 40, hired: 10 },
  { month: 'Feb', uploaded: 150, screening: 110, interview: 55, hired: 15 },
  { month: 'Mar', uploaded: 130, screening: 100, interview: 60, hired: 20 },
  { month: 'Apr', uploaded: 180, screening: 140, interview: 70, hired: 25 },
  { month: 'May', uploaded: 220, screening: 160, interview: 80, hired: 30 },
  { month: 'Jun', uploaded: 210, screening: 155, interview: 85, hired: 35 },
];

export function HiringVelocityChart() {
  return (
    <div className="h-[350px]">
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
          <Bar dataKey="uploaded" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="screening" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="interview" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
          <Bar dataKey="hired" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
