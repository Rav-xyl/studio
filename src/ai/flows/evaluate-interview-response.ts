'use server';
/**
 * @fileOverview A Genkit flow for evaluating a candidate's video interview response.
 *
 * - evaluateInterviewResponse - A function that evaluates a candidate's response to an interview question.
 * - EvaluateInterviewResponseInput - The input type for the evaluateInterviewResponse function.
 * - EvaluateInterviewResponseOutput - The return type for the evaluateInterviewResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateInterviewResponseInputSchema = z.object({
  question: z.string().describe('The interview question that was asked.'),
  candidateResponse: z.string().describe("The candidate's transcribed response to the question."),
  jobDescription: z.string().describe('The job description for the role.'),
});
export type EvaluateInterviewResponseInput = z.infer<typeof EvaluateInterviewResponseInputSchema>;

const EvaluateInterviewResponseOutputSchema = z.object({
  evaluation: z.string().describe("A concise evaluation of the candidate's response, focusing on clarity, relevance, and depth."),
  score: z.number().describe('A score from 1 to 10 for the response, where 10 is excellent.'),
  followUpQuestion: z.string().optional().describe('A suggested follow-up question based on the candidate\'s response.'),
});
export type EvaluateInterviewResponseOutput = z.infer<typeof EvaluateInterviewResponseOutputSchema>;

export async function evaluateInterviewResponse(input: EvaluateInterviewResponseInput): Promise<EvaluateInterviewResponseOutput> {
  return evaluateInterviewResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateInterviewResponsePrompt',
  input: {schema: EvaluateInterviewResponseInputSchema},
  output: {schema: EvaluateInterviewResponseOutputSchema},
  prompt: `You are ARYA, an AI interviewer. You are evaluating a candidate's response to an interview question for a specific role.

Job Description:
{{{jobDescription}}}

Interview Question:
"{{{question}}}"

Candidate's Response:
"{{{candidateResponse}}}"

Task:
1.  Evaluate the response for clarity, relevance to the job description, and depth of knowledge.
2.  Provide a score from 1 to 10.
3.  Suggest a relevant follow-up question to probe deeper into their response.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const evaluateInterviewResponseFlow = ai.defineFlow(
  {
    name: 'evaluateInterviewResponseFlow',
    inputSchema: EvaluateInterviewResponseInputSchema,
    outputSchema: EvaluateInterviewResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
