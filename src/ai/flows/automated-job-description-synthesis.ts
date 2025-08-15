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
  prompt: `You are an expert recruiter who specializes in writing job descriptions.

  Using the job title and company information provided, write a detailed job description that is tailored to the company.

  Job Title: {{{jobTitle}}}
  Company Information: {{{companyInformation}}}

  Job Description:
  
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
