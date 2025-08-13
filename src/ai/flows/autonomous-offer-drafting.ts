'use server';
/**
 * @fileOverview A Genkit flow for autonomously drafting a competitive job offer.
 *
 * - draftOfferLetter - A function that generates a job offer letter with salary and benefits.
 * - DraftOfferLetterInput - The input type for the draftOfferLetter function.
 * - DraftOfferLetterOutput - The return type for the draftOfferLetter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftOfferLetterInputSchema = z.object({
  candidateName: z.string().describe("The candidate's full name."),
  roleTitle: z.string().describe("The title of the job role."),
  candidateSkills: z.array(z.string()).describe("A list of the candidate's key skills."),
  candidateExperience: z.string().describe("A summary of the candidate's experience level."),
  companyName: z.string().describe("The name of the company."),
  companySalaryBands: z.string().describe("A description of the company's pre-approved salary bands for this role (e.g., 'Senior Level: $100k-$120k')."),
  simulatedMarketData: z.string().describe("Simulated external market data for this role (e.g., 'Average market rate for this role is $110k')."),
});
export type DraftOfferLetterInput = z.infer<typeof DraftOfferLetterInputSchema>;

const DraftOfferLetterOutputSchema = z.object({
  suggestedSalary: z.string().describe("The suggested competitive annual salary."),
  benefitsPackage: z.array(z.string()).describe("A list of suggested benefits."),
  offerLetterBody: z.string().describe("The full text of the drafted offer letter, including a compelling narrative."),
});
export type DraftOfferLetterOutput = z.infer<typeof DraftOfferLetterOutputSchema>;

export async function draftOfferLetter(input: DraftOfferLetterInput): Promise<DraftOfferLetterOutput> {
  return draftOfferLetterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftOfferLetterPrompt',
  input: {schema: DraftOfferLetterInputSchema},
  output: {schema: DraftOfferLetterOutputSchema},
  prompt: `You are an expert HR compensation analyst and negotiator. Your task is to autonomously draft a competitive job offer for a candidate.

Analyze the following information:
- Candidate: {{{candidateName}}}
- Role: {{{roleTitle}}}
- Skills & Experience: {{{candidateSkills}}}, {{{candidateExperience}}}
- Company: {{{companyName}}}
- Internal Salary Bands: {{{companySalaryBands}}}
- External Market Data: {{{simulatedMarketData}}}

**Task:**
1.  **Determine Salary:** Based on the candidate's skills, experience, internal bands, and external market data, determine a competitive and fair salary.
2.  **Suggest Benefits:** Provide a standard, attractive benefits package.
3.  **Draft Offer Letter:** Write a compelling offer letter. It should congratulate the candidate, clearly state the role, salary, and benefits, and include a persuasive closing statement about why they are a great fit for {{{companyName}}}.

Return the complete offer package in the specified JSON format.`,
});

const draftOfferLetterFlow = ai.defineFlow(
  {
    name: 'draftOfferLetterFlow',
    inputSchema: DraftOfferLetterInputSchema,
    outputSchema: DraftOfferLetterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
