'use server';

/**
 * @fileOverview AI-Assisted Candidate Review Flow.
 *
 * This flow reviews candidate data and provides a recommendation with justification.
 *
 * @file            ai-assisted-candidate-review.ts
 * @exports       reviewCandidate
 * @exports       ReviewCandidateInput
 * @exports       ReviewCandidateOutput
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewCandidateInputSchema = z.object({
  candidateData: z.string().describe('The candidate data to review.'),
  jobDescription: z.string().describe('The job description for the role.'),
});
export type ReviewCandidateInput = z.infer<typeof ReviewCandidateInputSchema>;

const ReviewCandidateOutputSchema = z.object({
  recommendation: z.string().describe('The AI recommendation (Hire, Reject, Maybe).'),
  justification: z.string().describe('The justification for the recommendation.'),
});
export type ReviewCandidateOutput = z.infer<typeof ReviewCandidateOutputSchema>;

export async function reviewCandidate(input: ReviewCandidateInput): Promise<ReviewCandidateOutput> {
  return reviewCandidateFlow(input);
}

const reviewCandidatePrompt = ai.definePrompt({
  name: 'reviewCandidatePrompt',
  input: {schema: ReviewCandidateInputSchema},
  output: {schema: ReviewCandidateOutputSchema},
  prompt: `You are an AI assistant that reviews candidate data and provides a recommendation.

  Based on the following candidate data:
  {{candidateData}}

  And the following job description:
  {{jobDescription}}

  Provide a recommendation (Hire, Reject, Maybe) and a justification for your recommendation.
  Ensure the recommendation aligns with the job description and candidate's qualifications.
  Consider skills, experience, and overall fit for the role.
  \n  Return your response in JSON format.\n  `,
});

const reviewCandidateFlow = ai.defineFlow(
  {
    name: 'reviewCandidateFlow',
    inputSchema: ReviewCandidateInputSchema,
    outputSchema: ReviewCandidateOutputSchema,
  },
  async input => {
    const {output} = await reviewCandidatePrompt(input);
    return output!;
  }
);
