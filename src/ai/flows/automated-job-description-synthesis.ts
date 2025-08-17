
'use server';

/**
 * @fileOverview This file defines a Genkit flow for automated job description synthesis.
 * It takes raw job description text as input, suggests multiple job titles, and reformats the description into a standardized structure.
 *
 * @file        automated-job-description-synthesis.ts
 * @exports   synthesizeJobDescription - A function to synthesize and format a job description.
 * @exports   SynthesizeJobDescriptionInput - The input type for the synthesizeJobDescription function.
 * @exports   SynthesizeJobDescriptionOutput - The output type for the synthesizeJobDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SynthesizeJobDescriptionInputSchema = z.object({
  jobDescriptionText: z.string().describe('The raw, unstructured text of the job description provided by the user.'),
});
export type SynthesizeJobDescriptionInput = z.infer<typeof SynthesizeJobDescriptionInputSchema>;

const SynthesizeJobDescriptionOutputSchema = z.object({
  suggestedTitles: z.array(z.string()).describe('An array of 3-5 suitable job titles suggested by the AI based on the job description text.'),
  formattedDescription: z.string().describe('The job description, rewritten and structured into a professional, standardized format.'),
});
export type SynthesizeJobDescriptionOutput = z.infer<typeof SynthesizeJobDescriptionOutputSchema>;


export async function synthesizeJobDescription(input: SynthesizeJobDescriptionInput): Promise<SynthesizeJobDescriptionOutput> {
  return synthesizeJobDescriptionFlow(input);
}

const synthesizeJobDescriptionPrompt = ai.definePrompt({
  name: 'synthesizeJobDescriptionPrompt',
  input: {schema: SynthesizeJobDescriptionInputSchema},
  output: {schema: SynthesizeJobDescriptionOutputSchema},
  prompt: `You are an expert recruiter and copywriter at a top-tier technology firm. Your task is to analyze a raw job description, suggest several appropriate job titles, and then rewrite the description into a standardized, professional format.

**Input Job Description:**
{{{jobDescriptionText}}}

**Execution Steps:**
1.  **Analyze and Suggest Titles:** Read the provided job description. Based on its content, generate a list of 3-5 diverse and accurate job titles.
2.  **Restructure and Rewrite:** Parse the entire input text and rewrite it into a clear, concise, and compelling job description. The output MUST follow this exact structure:
    *   **About the Role:** A brief, 1-2 sentence overview of the position's impact and purpose.
    *   **Key Responsibilities:** A bulleted list of 4-6 primary duties and tasks.
    *   **Required Skills & Qualifications:** A bulleted list of 5-7 essential, non-negotiable skills and qualifications (e.g., '5+ years of experience with React', 'Expertise in data structures and algorithms').
    *   **Preferred Qualifications:** A bulleted list of 2-3 "nice-to-have" skills that would make a candidate stand out (e.g., 'Experience with GraphQL', 'Contributions to open-source projects').

The final output should be professional and aimed at attracting highly qualified candidates. Do not include generic corporate jargon.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.
  `,
});

const synthesizeJobDescriptionFlow = ai.defineFlow(
  {
    name: 'synthesizeJobDescriptionFlow',
    inputSchema: SynthesizeJobDescriptionInputSchema,
    outputSchema: SynthesizeJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await synthesizeJobDescriptionPrompt(input);
    return output!;
  }
);
