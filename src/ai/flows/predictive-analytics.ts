'use server';
/**
 * @fileOverview A Genkit flow for generating predictive hiring analytics.
 *
 * - generatePredictiveAnalysis - A function that forecasts hiring metrics based on historical data.
 * - GeneratePredictiveAnalysisInput - The input type for the generatePredictiveAnalysis function.
 * - GeneratePredictiveAnalysisOutput - The return type for the generatePredictiveAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePredictiveAnalysisInputSchema = z.object({
  historicalData: z.object({
    hiresPerMonth: z.array(z.number()).describe("An array representing the number of hires for each of the last 6 months."),
    avgTimeToHire: z.number().describe("The average time-to-hire in days over the last 6 months."),
    roleDistribution: z.record(z.string(), z.number()).describe("An object showing the number of hires for each role in the last quarter."),
  }),
});
export type GeneratePredictiveAnalysisInput = z.infer<typeof GeneratePredictiveAnalysisInputSchema>;

const GeneratePredictiveAnalysisOutputSchema = z.object({
  predictedHiresNextQuarter: z.array(z.number()).describe("An array predicting the number of hires for each of the next 3 months."),
  predictedAvgTimeToHire: z.number().describe("The predicted average time-to-hire in days for the next quarter."),
  insight: z.string().describe("A brief, actionable insight based on the analysis of historical and predicted data."),
});
export type GeneratePredictiveAnalysisOutput = z.infer<typeof GeneratePredictiveAnalysisOutputSchema>;

export async function generatePredictiveAnalysis(input: GeneratePredictiveAnalysisInput): Promise<GeneratePredictiveAnalysisOutput> {
  return generatePredictiveAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePredictiveAnalysisPrompt',
  input: {schema: GeneratePredictiveAnalysisInputSchema},
  output: {schema: GeneratePredictiveAnalysisOutputSchema},
  prompt: `You are a data scientist specializing in HR analytics. Analyze the provided historical hiring data and generate a predictive forecast for the next quarter.

**Historical Data:**
- Hires over the last 6 months: {{{historicalData.hiresPerMonth}}}
- Average Time-to-Hire (days): {{{historicalData.avgTimeToHire}}}
- Role Distribution (last quarter): {{{historicalData.roleDistribution}}}

**Task:**
1.  **Forecast Hires:** Based on the trend from the last 6 months, predict the number of hires for each of the next 3 months.
2.  **Forecast Time-to-Hire:** Predict the average time-to-hire for the next quarter, considering recent trends.
3.  **Provide Insight:** Generate a single, actionable insight for the HR team based on your analysis. For example, identify a potential bottleneck or a positive trend.

Return your complete forecast and insight in the specified JSON format.`,
});

const generatePredictiveAnalysisFlow = ai.defineFlow(
  {
    name: 'generatePredictiveAnalysisFlow',
    inputSchema: GeneratePredictiveAnalysisInputSchema,
    outputSchema: GeneratePredictiveAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
