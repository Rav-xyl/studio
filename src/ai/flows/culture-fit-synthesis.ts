'use server';
/**
 * @fileOverview A Genkit flow for synthesizing a "Culture Fit" profile for a candidate.
 *
 * - cultureFitSynthesis - A function that analyzes a candidate's qualitative data to assess cultural alignment.
 * - CultureFitSynthesisInput - The input type for the cultureFitSynthesis function.
 * - CultureFitSynthesisOutput - The return type for the cultureFitSynthesis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CultureFitSynthesisInputSchema = z.object({
  candidateNarrative: z.string().describe("The AI-generated narrative summary of the candidate's resume."),
  inferredSoftSkills: z.array(z.string()).describe("A list of soft skills inferred by the AI during resume screening."),
  companyValues: z.string().describe("A comma-separated list of the company's core cultural values (e.g., 'Innovation, Collaboration, Customer-Centricity')."),
});
export type CultureFitSynthesisInput = z.infer<typeof CultureFitSynthesisInputSchema>;

const CultureFitSynthesisOutputSchema = z.object({
  alignmentScore: z.number().describe("A score from 0 to 100 indicating the degree of cultural alignment."),
  summary: z.string().describe("A 2-3 sentence qualitative summary of the candidate's cultural alignment."),
  alignmentBreakdown: z.array(z.object({
    value: z.string().describe("The company value being assessed."),
    evidence: z.string().describe("Specific evidence or indicators from the candidate's profile that support or contradict this value."),
  })).describe("A breakdown of alignment for each company value."),
});
export type CultureFitSynthesisOutput = z.infer<typeof CultureFitSynthesisOutputSchema>;

export async function cultureFitSynthesis(input: CultureFitSynthesisInput): Promise<CultureFitSynthesisOutput> {
  return cultureFitSynthesisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cultureFitSynthesisPrompt',
  input: {schema: CultureFitSynthesisInputSchema},
  output: {schema: CultureFitSynthesisOutputSchema},
  prompt: `You are an expert organizational psychologist. Your task is to generate a 'Cultural Alignment Profile' for a candidate based on their resume narrative and inferred soft skills.

**Company Values:**
{{{companyValues}}}

**Candidate Profile:**
- Narrative Summary: {{{candidateNarrative}}}
- Inferred Soft Skills: {{{inferredSoftSkills}}}

**Task:**
1.  **Analyze Alignment:** Evaluate how the candidate's narrative and soft skills align with each of the company's values.
2.  **Score:** Provide an overall alignment score from 0 to 100.
3.  **Summarize:** Write a concise qualitative summary of your findings.
4.  **Breakdown:** For each company value, provide specific evidence from the candidate's profile that supports (or contradicts) their alignment with that value.

Return your complete analysis in the specified JSON format.`,
});

const cultureFitSynthesisFlow = ai.defineFlow(
  {
    name: 'cultureFitSynthesisFlow',
    inputSchema: CultureFitSynthesisInputSchema,
    outputSchema: CultureFitSynthesisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
