"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalInterviewReview = finalInterviewReview;
/**
 * @fileOverview The "BOSS" AI review flow for final candidate assessment.
 *
 * This flow takes a comprehensive interview report and provides a final, holistic
 * hiring recommendation. It acts as the ultimate decision-making supervisor.
 *
 * @file            final-interview-review.ts
 * @exports         finalInterviewReview
 * @exports         FinalInterviewReviewInput
 * @exports         FinalInterviewReviewOutput
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const FinalInterviewReviewInputSchema = genkit_2.z.object({
    interviewReport: genkit_2.z.string().describe('The full text report from the AI video interview, including transcript and initial evaluations.'),
});
const FinalInterviewReviewOutputSchema = genkit_2.z.object({
    finalRecommendation: genkit_2.z.string().describe("The AI's final hiring decision (e.g., 'Strong Hire', 'Proceed with Caution', 'Do Not Hire')."),
    overallAssessment: genkit_2.z.string().describe("A concise, high-level summary of the candidate's performance and fit."),
    keyStrengths: genkit_2.z.array(genkit_2.z.string()).describe("A list of the candidate's most significant strengths observed during the interview."),
    potentialConcerns: genkit_2.z.array(genkit_2.z.string()).describe("A list of any red flags or areas of concern to consider."),
});
async function finalInterviewReview(input) {
    return finalInterviewReviewFlow(input);
}
const finalReviewPrompt = genkit_1.ai.definePrompt({
    name: 'finalReviewPrompt',
    input: { schema: FinalInterviewReviewInputSchema },
    output: { schema: FinalInterviewReviewOutputSchema },
    prompt: `You are the "BOSS", an advanced AI supervisor specializing in final-round talent assessment. You have been given a complete interview report for a candidate. Your task is to perform a holistic, final review and provide a definitive hiring recommendation. You must look beyond simple answers and evaluate the underlying communication style, problem-solving approach, and potential cultural fit based on the entire transcript.

  **Interview Report:**
  {{{interviewReport}}}

  **Your Task:**
  1.  **Synthesize All Data:** Read the entire report, including the transcript and ARYA's initial evaluations. Do not just repeat ARYA's scores; synthesize them into a higher-level analysis.
  2.  **Identify Core Competencies:** Based on the dialogue, identify the candidate's key strengths (e.g., 'Clear Communicator', 'Systematic Problem-Solver', 'Demonstrated Resilience').
  3.  **Flag Potential Risks:** Identify any potential concerns or red flags that may not be obvious from a surface-level review (e.g., 'Vague on technical details', 'Struggled to articulate failures', 'Overly reliant on buzzwords').
  4.  **Formulate Overall Assessment:** Write a concise, executive-level summary of the candidate's overall profile and fit for a demanding, high-performance environment.
  5.  **Make the Final Call:** Provide a clear, final recommendation: "Strong Hire", "Proceed with Caution", or "Do Not Hire".

  IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const finalInterviewReviewFlow = genkit_1.ai.defineFlow({
    name: 'finalInterviewReviewFlow',
    inputSchema: FinalInterviewReviewInputSchema,
    outputSchema: FinalInterviewReviewOutputSchema,
}, async (input) => {
    const { output } = await finalReviewPrompt(input);
    return output;
});
