
'use server';
/**
 * @fileOverview A Genkit flow for conducting the final, conversational AI interview.
 *
 * - conductFinalInterview - A function that asks a series of questions and compiles a report.
 * - ConductFinalInterviewInput - The input type for the function.
 * - ConductFinalInterviewOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConductFinalInterviewInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job the candidate is interviewing for.'),
  jobDescription: z.string().describe('The description of the job.'),
  candidateNarrative: z.string().describe("A summary of the candidate's background and skills."),
});
export type ConductFinalInterviewInput = z.infer<typeof ConductFinalInterviewInputSchema>;

const InterviewTurnSchema = z.object({
    question: z.string().describe('The question asked by the AI.'),
    evaluation: z.string().describe("A concise evaluation of the candidate's response."),
    score: z.number().describe('A score from 1 to 10 for the response.'),
});

const ConductFinalInterviewOutputSchema = z.object({
  interviewTranscript: z.array(InterviewTurnSchema).describe("A list of questions asked and the AI's evaluation of the answers."),
  finalReport: z.string().describe("A summary report of the entire interview, including an overall assessment."),
});
export type ConductFinalInterviewOutput = z.infer<typeof ConductFinalInterviewOutputSchema>;

export async function conductFinalInterview(input: ConductFinalInterviewInput): Promise<ConductFinalInterviewOutput> {
  return conductFinalInterviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conductFinalInterviewPrompt',
  input: {schema: ConductFinalInterviewInputSchema},
  output: {schema: ConductFinalInterviewOutputSchema},
  prompt: `You are ARYA, an advanced AI interviewer. Your task is to conduct a final, conversational interview with a candidate.

**Candidate Details:**
- Role: {{{jobTitle}}}
- Role Description: {{{jobDescription}}}
- Candidate Summary: {{{candidateNarrative}}}

**Instructions:**
1.  **Generate 3 Questions:** Based on the role and candidate summary, generate a sequence of three interview questions.
    - One behavioral question (e.g., "Tell me about a time you faced a difficult challenge.").
    - One situational question relevant to the role (e.g., "Imagine a critical bug is found in production just before a major release. How would you handle it?").
    - One question about their motivation or career goals.
2.  **Simulate Evaluation:** For each question, provide a *simulated* evaluation and a score (1-10) as if the candidate had given a reasonably good, but not perfect, answer.
3.  **Write Final Report:** After the three questions, write a concise final summary report of the interview, giving an overall assessment of the simulated candidate's performance.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const conductFinalInterviewFlow = ai.defineFlow(
  {
    name: 'conductFinalInterviewFlow',
    inputSchema: ConductFinalInterviewInputSchema,
    outputSchema: ConductFinalInterviewOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
