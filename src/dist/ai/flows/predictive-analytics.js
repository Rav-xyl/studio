"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePredictiveAnalysis = generatePredictiveAnalysis;
/**
 * @fileOverview A Genkit flow for generating predictive hiring analytics.
 *
 * - generatePredictiveAnalysis - A function that forecasts hiring metrics based on historical data.
 * - GeneratePredictiveAnalysisInput - The input type for the generatePredictiveAnalysis function.
 * - GeneratePredictiveAnalysisOutput - The return type for the generatePredictiveAnalysis function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const GeneratePredictiveAnalysisInputSchema = genkit_2.z.object({
    historicalData: genkit_2.z.object({
        hiresPerMonth: genkit_2.z.array(genkit_2.z.number()).describe("An array representing the number of hires for each of the last 6 months."),
        avgTimeToHire: genkit_2.z.number().describe("The average time-to-hire in days over the last 6 months."),
        roleDistribution: genkit_2.z.record(genkit_2.z.string(), genkit_2.z.number()).describe("An object showing the number of hires for each role in the last quarter."),
    }),
});
const GeneratePredictiveAnalysisOutputSchema = genkit_2.z.object({
    predictedHiresNextQuarter: genkit_2.z.array(genkit_2.z.number()).describe("An array predicting the number of hires for each of the next 3 months."),
    predictedAvgTimeToHire: genkit_2.z.number().describe("The predicted average time-to-hire in days for the next quarter."),
    insight: genkit_2.z.string().describe("A brief, actionable insight based on the analysis of historical and predicted data."),
});
async function generatePredictiveAnalysis(input) {
    return generatePredictiveAnalysisFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'generatePredictiveAnalysisPrompt',
    input: { schema: GeneratePredictiveAnalysisInputSchema },
    output: { schema: GeneratePredictiveAnalysisOutputSchema },
    prompt: `You are a data scientist specializing in HR analytics. Analyze the provided historical hiring data and generate a predictive forecast for the next quarter.

**Historical Data:**
- Hires over the last 6 months: {{{historicalData.hiresPerMonth}}}
- Average Time-to-Hire (days): {{{historicalData.avgTimeToHire}}}
- Role Distribution (last quarter): {{{historicalData.roleDistribution}}}

**Task:**
1.  **Forecast Hires:** Based on the trend from the last 6 months, predict the number of hires for each of the next 3 months.
2.  **Forecast Time-to-Hire:** Predict the average time-to-hire for the next quarter, considering recent trends.
3.  **Provide Insight:** Generate a single, actionable insight for the HR team based on your analysis. For example, identify a potential bottleneck or a positive trend.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const generatePredictiveAnalysisFlow = genkit_1.ai.defineFlow({
    name: 'generatePredictiveAnalysisFlow',
    inputSchema: GeneratePredictiveAnalysisInputSchema,
    outputSchema: GeneratePredictiveAnalysisOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
