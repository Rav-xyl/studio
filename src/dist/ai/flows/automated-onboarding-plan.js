"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOnboardingPlan = generateOnboardingPlan;
/**
 * @fileOverview A Genkit flow for generating a personalized 30-60-90 day onboarding plan.
 *
 * - generateOnboardingPlan - A function that creates a post-hire success forecast and onboarding plan.
 * - GenerateOnboardingPlanInput - The input type for the generateOnboardingPlan function.
 * - GenerateOnboardingPlanOutput - The return type for the generateOnboardingPlan function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const GenerateOnboardingPlanInputSchema = genkit_2.z.object({
    candidateName: genkit_2.z.string().describe("The new hire's name."),
    roleTitle: genkit_2.z.string().describe("The title of the role the candidate was hired for."),
    roleResponsibilities: genkit_2.z.string().describe("The key responsibilities of the role."),
    candidateStrengths: genkit_2.z.array(genkit_2.z.string()).describe("The candidate's identified strengths from resume analysis and interviews."),
    companyCulture: genkit_2.z.string().describe("A brief description of the company's culture (e.g., 'fast-paced startup', 'structured enterprise')."),
});
const GenerateOnboardingPlanOutputSchema = genkit_2.z.object({
    performanceForecast: genkit_2.z.string().describe("A 2-3 sentence prediction of the new hire's long-term success, highlighting key areas for support."),
    onboardingPlan: genkit_2.z.object({
        days30: genkit_2.z.array(genkit_2.z.string()).describe("A list of key goals and activities for the first 30 days."),
        days60: genkit_2.z.array(genkit_2.z.string()).describe("A list of key goals and activities for the next 30 days (days 31-60)."),
        days90: genkit_2.z.array(genkit_2.z.string()).describe("A list of key goals and activities for the final 30 days of the onboarding period (days 61-90)."),
    }),
});
async function generateOnboardingPlan(input) {
    return generateOnboardingPlanFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'generateOnboardingPlanPrompt',
    input: { schema: GenerateOnboardingPlanInputSchema },
    output: { schema: GenerateOnboardingPlanOutputSchema },
    prompt: `You are an expert HR strategist specializing in talent development and post-hire success. Your task is to create a personalized 30-60-90 day onboarding plan and a performance forecast for a new hire.

New Hire: {{{candidateName}}}
Role: {{{roleTitle}}}
Key Responsibilities: {{{roleResponsibilities}}}
Identified Strengths: {{{candidateStrengths}}}
Company Culture: {{{companyCulture}}}

**Task:**
1.  **Performance Forecast:** Based on the candidate's strengths and the role, write a 2-3 sentence forecast predicting their potential long-term success. Identify 1-2 key areas where they might need early support to thrive in the {{{companyCulture}}} environment.
2.  **30-60-90 Day Plan:** Generate a structured onboarding plan.
    -   **First 30 Days:** Focus on learning, integration, and understanding the company culture. Goals should be about absorbing information and building relationships.
    -   **Next 30 Days (60 Days):** Focus on transitioning from learning to contributing. Goals should involve taking ownership of small tasks and starting to apply their skills.
    -   **Final 30 Days (90 Days):** Focus on full autonomy and strategic contribution. Goals should reflect independent work and proactive improvements.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const generateOnboardingPlanFlow = genkit_1.ai.defineFlow({
    name: 'generateOnboardingPlanFlow',
    inputSchema: GenerateOnboardingPlanInputSchema,
    outputSchema: GenerateOnboardingPlanOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
