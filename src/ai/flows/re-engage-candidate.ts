'use server';
/**
 * @fileOverview A Genkit flow for re-engaging previously rejected candidates.
 *
 * - reEngageCandidate - A function that analyzes a rejected candidate against a new role and drafts a re-engagement email.
 * - ReEngageCandidateInput - The input type for the reEngageCandidate function.
 * - ReEngageCandidateOutput - The return type for the reEngageCandidate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReEngageCandidateInputSchema = z.object({
  candidateName: z.string().describe("The candidate's full name."),
  candidateSkills: z.array(z.string()).describe("The candidate's list of skills."),
  candidateNarrative: z.string().describe("The original narrative summary of the candidate."),
  newJobTitle: z.string().describe("The title of the new job role being considered."),
  newJobDescription: z.string().describe("The description of the new job role."),
  companyName: z.string().describe("The name of the company."),
});
export type ReEngageCandidateInput = z.infer<typeof ReEngageCandidateInputSchema>;

const ReEngageCandidateOutputSchema = z.object({
  isMatch: z.boolean().describe("Whether the AI determined the candidate is a strong match for the new role."),
  confidenceScore: z.number().describe("A confidence score (0-100) of how good a fit the candidate is for the new role."),
  emailSubject: z.string().optional().describe("The subject of the re-engagement email, if the candidate is a match."),
  emailBody: z.string().optional().describe("The body of the personalized re-engagement email, if the candidate is a match."),
});
export type ReEngageCandidateOutput = z.infer<typeof ReEngageCandidateOutputSchema>;

export async function reEngageCandidate(input: ReEngageCandidateInput): Promise<ReEngageCandidateOutput> {
  return reEngageCandidateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reEngageCandidatePrompt',
  input: {schema: ReEngageCandidateInputSchema},
  output: {schema: ReEngageCandidateOutputSchema},
  prompt: `You are an expert AI recruiter tasked with re-evaluating a previously rejected candidate for a new role.

**Candidate Profile:**
- Name: {{{candidateName}}}
- Skills: {{{candidateSkills}}}
- Narrative: {{{candidateNarrative}}}

**New Role:**
- Title: {{{newJobTitle}}}
- Description: {{{newJobDescription}}}

**Task:**
1.  **Analyze Fit:** Carefully compare the candidate's profile with the new job description. Determine if they are a strong match. The new role might value their skills differently.
2.  **Score Confidence:** Provide a confidence score from 0-100 indicating how strong the match is. A score above 75 indicates a strong match.
3.  **Draft Re-engagement Email:** If it is a strong match (score > 75), draft a personalized, encouraging, and professional email to {{{candidateName}}} from "The {{{companyName}}} Hiring Team". The email should acknowledge their previous application, state that a new, more suitable role has opened up, and invite them to re-apply or express their interest.

Return your complete analysis in the specified JSON format. If the candidate is not a match, set isMatch to false and omit the email fields.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const reEngageCandidateFlow = ai.defineFlow(
  {
    name: 'reEngageCandidateFlow',
    inputSchema: ReEngageCandidateInputSchema,
    outputSchema: ReEngageCandidateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
