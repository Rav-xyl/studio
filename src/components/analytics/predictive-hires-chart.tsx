
'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart';
import { generatePredictiveAnalysis } from '@/ai/flows/predictive-analytics';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const historicalData: any[] = [
  // Data will be populated dynamically in a real application
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
    const [chartData, setChartData] = useState<any[]>(historicalData);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchPredictions = async () => {
            setIsLoading(true);
            try {
                const result = await generatePredictiveAnalysis({
                    historicalData: {
                        hiresPerMonth: [20, 25, 30, 35, 40, 45],
                        avgTimeToHire: 32,
                        roleDistribution: { 'Engineering': 15, 'Product': 5, 'Design': 3 }
                    }
                });
                
                const predictedQuarters = [
                    { quarter: 'Q1 (Pred)', predicted: result.predictedHiresNextQuarter[0], actual: null },
                    { quarter: 'Q2 (Pred)', predicted: result.predictedHiresNextQuarter[1], actual: null },
                    { quarter: 'Q3 (Pred)', predicted: result.predictedHiresNextQuarter[2], actual: null },
                ];
                
                setChartData([...historicalData, ...predictedQuarters]);

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
    }, [toast]);


  return (
    <div className="h-[350px]">
       {isLoading && chartData.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin h-8 w-8 text-primary"/>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          No data available to display chart.
        </div>
      ) : (
      <ChartContainer config={chartConfig} className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
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
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-predicted)"
              strokeWidth={2}
              strokeDasharray="5 5"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
      )}
    </div>
  );
}
