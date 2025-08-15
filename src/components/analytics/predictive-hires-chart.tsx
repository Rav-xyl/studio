
'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { generatePredictiveAnalysis } from '@/ai/flows/predictive-analytics';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Candidate } from '@/lib/types';

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

interface PredictiveHiresChartProps {
  candidates: Candidate[];
}

export function PredictiveHiresChart({ candidates }: PredictiveHiresChartProps) {
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPredictions = async () => {
            setIsLoading(true);
            try {
                // In a real app, this historical data would come from a database.
                // We simulate 6 months of hires for the AI to analyze.
                const hiresPerMonth = [20, 25, 30, 35, 40, 45]; 
                const roleDistribution = candidates.filter(c => c.status === 'Hired').reduce((acc, c) => {
                    acc[c.role] = (acc[c.role] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const result = await generatePredictiveAnalysis({
                    historicalData: {
                        hiresPerMonth: hiresPerMonth,
                        avgTimeToHire: 32, // static for now
                        roleDistribution: roleDistribution
                    }
                });
                
                const historicalMonths = hiresPerMonth.map((hires, index) => ({
                    month: `M-${6 - index}`,
                    actual: hires,
                }));

                const predictedMonths = [
                    { month: 'M+1', predicted: result.predictedHiresNextQuarter[0], actual: null },
                    { month: 'M+2', predicted: result.predictedHiresNextQuarter[1], actual: null },
                    { month: 'M+3', predicted: result.predictedHiresNextQuarter[2], actual: null },
                ];
                
                setChartData([...historicalMonths, ...predictedMonths]);

                toast({
                    title: "AI Insight Generated",
                    description: result.insight,
                });

            } catch (error) {
                console.error("Failed to fetch predictions:", error);
                toast({ title: 'Error', description: 'Could not fetch hiring predictions.', variant: 'destructive'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchPredictions();
    }, [toast, candidates]);


  return (
    <div className="h-[350px]">
       {isLoading ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin h-8 w-8 text-primary"/>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          Not enough data to generate predictions.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
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
              connectNulls
              name="Actual Hires"
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-predicted)"
              strokeWidth={2}
              strokeDasharray="5 5"
              connectNulls
              name="Predicted Hires"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      )}
    </div>
  );
}
