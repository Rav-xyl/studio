
// use server'

/**
 * @fileOverview This file defines a Genkit flow for automated job description synthesis.
 * It takes a job title as input and generates a detailed job description by analyzing a company's public information.
 *
 * @file        automated-job-description-synthesis.ts
 * @exports   synthesizeJobDescription - A function to synthesize a job description.
 * @exports   SynthesizeJobDescriptionInput - The input type for the synthesizeJobDescription function.
 * @exports   SynthesizeJobDescriptionOutput - The output type for the synthesizeJobDescription function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SynthesizeJobDescriptionInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job to synthesize a description for.'),
  companyInformation: z.string().describe('Information about the company to be used in the prompt. This information will be scraped from the web.')
});
export type SynthesizeJobDescriptionInput = z.infer<typeof SynthesizeJobDescriptionInputSchema>;

const SynthesizeJobDescriptionOutputSchema = z.object({
  jobDescription: z.string().describe('The synthesized job description.'),
});
export type SynthesizeJobDescriptionOutput = z.infer<typeof SynthesizeJobDescriptionOutputSchema>;


export async function synthesizeJobDescription(input: SynthesizeJobDescriptionInput): Promise<SynthesizeJobDescriptionOutput> {
  return synthesizeJobDescriptionFlow(input);
}

const synthesizeJobDescriptionPrompt = ai.definePrompt({
  name: 'synthesizeJobDescriptionPrompt',
  input: {schema: SynthesizeJobDescriptionInputSchema},
  output: {schema: SynthesizeJobDescriptionOutputSchema},
  prompt: `You are an expert recruiter and copywriter at a top-tier technology firm. Your task is to write a clear, concise, and compelling job description for the role of {{{jobTitle}}}.

The job description must be structured, professional, and focus on attracting highly qualified candidates. It should not contain fluff or generic corporate jargon.

Based on the provided job title and company information, generate a job description that includes the following sections:
1.  **About the Role:** A brief, 1-2 sentence overview of the position's impact and purpose.
2.  **Key Responsibilities:** A bulleted list of 4-6 primary duties and tasks the candidate will be expected to perform.
3.  **Required Skills & Qualifications:** A bulleted list of 5-7 essential, non-negotiable skills and qualifications (e.g., '5+ years of experience with React', 'Expertise in data structures and algorithms').
4.  **Preferred Qualifications:** A bulleted list of 2-3 "nice-to-have" skills that would make a candidate stand out (e.g., 'Experience with GraphQL', 'Contributions to open-source projects').

Job Title: {{{jobTitle}}}
Company Information: {{{companyInformation}}}

Generate the full job description text.

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

    