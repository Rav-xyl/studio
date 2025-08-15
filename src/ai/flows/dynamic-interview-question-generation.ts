'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating dynamic interview questions based on candidate resume and role requirements.
 *
 * - generateInterviewQuestions - A function that generates customized interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  resumeText: z.string().describe('The text content of the candidate\'s resume.'),
  jobDescription: z.string().describe('The job description for the role.'),
  candidateAnalysis: z.string().describe('Deep review analysis of the candidate.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of dynamically generated interview questions.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsInput
): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dynamicInterviewQuestionPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert recruiter. Generate a set of interview questions tailored to the candidate and the role.

Candidate Resume:
{{{resumeText}}}

Job Description:
{{{jobDescription}}}

Candidate Analysis:
{{{candidateAnalysis}}}

Generate 5-7 interview questions that probe specific areas of the candidate's profile and assess their suitability for the role. Ensure that questions are open-ended and encourage the candidate to elaborate on their experiences and skills.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
