'use server';
/**
 * @fileOverview A Genkit flow that analyzes an overridden AI decision to suggest rubric refinements.
 *
 * - analyzeHiringOverride - A function that performs root-cause analysis on a hiring decision override.
 * - AnalyzeHiringOverrideInput - The input type for the analyzeHiringOverride function.
 * - AnalyzeHiringOverrideOutput - The return type for the analyzeHiringOverride function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeHiringOverrideInputSchema = z.object({
  candidateProfile: z.object({
    name: z.string(),
    skills: z.array(z.string()),
    narrative: z.string(),
    aiInitialDecision: z.string().describe("The AI's initial recommendation (e.g., 'Reject')."),
    aiInitialScore: z.number().describe("The AI's initial score for the candidate."),
    humanFinalDecision: z.string().describe("The human recruiter's final decision (e.g., 'Hired')."),
  }),
  roleTitle: z.string().describe("The title of the job role."),
  currentRubricWeights: z.string().describe("A description or JSON string of the current scoring rubric weights."),
});
export type AnalyzeHiringOverrideInput = z.infer<typeof AnalyzeHiringOverrideInputSchema>;

const AnalyzeHiringOverrideOutputSchema = z.object({
    analysis: z.string().describe("A root-cause analysis explaining the likely reason for the discrepancy between the AI and human decisions."),
    suggestedChange: z.string().describe("A specific, actionable suggestion for changing the rubric weights (e.g., 'Increase weight for Skill X by 5%')."),
});
export type AnalyzeHiringOverrideOutput = z.infer<typeof AnalyzeHiringOverrideOutputSchema>;

export async function analyzeHiringOverride(input: AnalyzeHiringOverrideInput): Promise<AnalyzeHiringOverrideOutput> {
  return analyzeHiringOverrideFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeHiringOverridePrompt',
  input: {schema: AnalyzeHiringOverrideInputSchema},
  output: {schema: AnalyzeHiringOverrideOutputSchema},
  prompt: `You are an AI system auditor. A human recruiter has overridden your initial hiring recommendation. Your task is to perform a root-cause analysis to understand why and suggest a refinement to your own scoring rubric.

**Case Details:**
- Role: {{{roleTitle}}}
- Candidate: {{{candidateProfile.name}}}
- Candidate Skills: {{{candidateProfile.skills}}}
- Candidate Narrative: {{{candidateProfile.narrative}}}
- Your Initial Score: {{{candidateProfile.aiInitialScore}}}
- Your Initial Decision: {{{candidateProfile.aiInitialDecision}}}
- Recruiter's Final Decision: {{{candidateProfile.humanFinalDecision}}}
- Current Rubric Weights: {{{currentRubricWeights}}}

**Task:**
1.  **Analyze the Discrepancy:** Compare the candidate's profile to your initial decision. Identify the most likely attribute or skill that you undervalued, which the human recruiter valued highly. For instance, did you penalize a non-traditional career path that the recruiter saw as a sign of adaptability? Did you undervalue a specific skill that is critical for this role?
2.  **Suggest a Rubric Change:** Based on your analysis, propose a specific, actionable change to the rubric weights to improve future accuracy for this type of role. The suggestion should be clear and concise.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const analyzeHiringOverrideFlow = ai.defineFlow(
  {
    name: 'analyzeHiringOverrideFlow',
    inputSchema: AnalyzeHiringOverrideInputSchema,
    outputSchema: AnalyzeHiringOverrideOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
