
'use server';
/**
 * @fileOverview A Genkit flow for proctoring and evaluating a written technical exam.
 *
 * - proctorTechnicalExam - A function that evaluates a candidate's written response and proctoring data.
 * - ProctorTechnicalExamInput - The input type for the function.
 * - ProctorTechnicalExamOutput - The output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProctorTechnicalExamInputSchema = z.object({
  question: z.string().describe('The technical question that was asked.'),
  candidateAnswer: z.string().describe("The candidate's full written answer to the question."),
  proctoringLog: z.array(z.string()).describe("A log of proctoring events, such as 'Candidate switched tabs'."),
  ambientAudioTranscript: z.string().describe("A transcript of ambient audio captured during the exam, to detect other voices."),
});
export type ProctorTechnicalExamInput = z.infer<typeof ProctorTechnicalExamInputSchema>;

const ProctorTechnicalExamOutputSchema = z.object({
  evaluation: z.string().describe("A concise evaluation of the candidate's written answer, focusing on technical correctness, clarity, and depth."),
  score: z.number().describe('A score from 0 to 100 for the response. A score below 70 is a failure.'),
  proctoringSummary: z.string().describe("A summary of the proctoring analysis, noting any suspicious events."),
  isPass: z.boolean().describe("Whether the candidate passed the technical round (score >= 70)."),
});
export type ProctorTechnicalExamOutput = z.infer<typeof ProctorTechnicalExamOutputSchema>;

export async function proctorTechnicalExam(input: ProctorTechnicalExamInput): Promise<ProctorTechnicalExamOutput> {
  return proctorTechnicalExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proctorTechnicalExamPrompt',
  input: {schema: ProctorTechnicalExamInputSchema},
  output: {schema: ProctorTechnicalExamOutputSchema},
  prompt: `You are a Senior Staff Engineer and an expert exam proctor. Your task is to evaluate a candidate's written technical exam answer and analyze their behavior based on proctoring data.

**Technical Question:**
"{{{question}}}"

**Candidate's Written Answer:**
\`\`\`
{{{candidateAnswer}}}
\`\`\`

**Proctoring & Behavioral Data:**
- **Event Log:** {{{proctoringLog}}}
- **Ambient Audio Transcript:** "{{{ambientAudioTranscript}}}"

**Your Task:**
1.  **Evaluate Answer Quality:** Critically assess the candidate's written answer. Look for correctness, efficiency, clarity of thought, and handling of edge cases.
2.  **Analyze Proctoring Data:** Review the event log and audio transcript for any signs of cheating. 
    - **CRITICAL:** Hearing other human voices in the audio is a major red flag and should result in an automatic failure (score of 0).
    - **NOTE:** A "tab switched" event is a potential red flag but should be considered in context. It is NOT an automatic failure. Note it in the summary and consider a minor score deduction only if it happens frequently or seems to correlate with the answer's content.
3.  **Generate a Score:** Based on both the answer quality and the proctoring analysis, provide a score from 0 to 100. Penalize heavily for major proctoring violations like hearing other voices.
4.  **Determine Pass/Fail:** Set the isPass field to true if the score is 70 or above, otherwise false.
5.  **Write Summaries:** Provide a concise evaluation of the technical answer and a separate summary of the proctoring findings.

The final score must be a holistic assessment of both technical skill and exam integrity.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const proctorTechnicalExamFlow = ai.defineFlow(
  {
    name: 'proctorTechnicalExamFlow',
    inputSchema: ProctorTechnicalExamInputSchema,
    outputSchema: ProctorTechnicalExamOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    
