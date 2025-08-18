"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateInterviewResponse = evaluateInterviewResponse;
/**
 * @fileOverview A Genkit flow for evaluating a candidate's video interview response.
 *
 * - evaluateInterviewResponse - A function that evaluates a candidate's response to an interview question.
 * - EvaluateInterviewResponseInput - The input type for the evaluateInterviewResponse function.
 * - EvaluateInterviewResponseOutput - The return type for the evaluateInterviewResponse function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const EvaluateInterviewResponseInputSchema = genkit_2.z.object({
    question: genkit_2.z.string().describe('The interview question that was asked.'),
    candidateResponse: genkit_2.z.string().describe("The candidate's transcribed response to the question."),
    jobDescription: genkit_2.z.string().describe('The job description for the role.'),
});
const EvaluateInterviewResponseOutputSchema = genkit_2.z.object({
    evaluation: genkit_2.z.string().describe("A concise evaluation of the candidate's response, focusing on clarity, relevance, and depth."),
    score: genkit_2.z.number().describe('A score from 1 to 10 for the response, where 10 is excellent.'),
    followUpQuestion: genkit_2.z.string().optional().describe('A suggested follow-up question based on the candidate\'s response.'),
});
async function evaluateInterviewResponse(input) {
    return evaluateInterviewResponseFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'evaluateInterviewResponsePrompt',
    input: { schema: EvaluateInterviewResponseInputSchema },
    output: { schema: EvaluateInterviewResponseOutputSchema },
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
const evaluateInterviewResponseFlow = genkit_1.ai.defineFlow({
    name: 'evaluateInterviewResponseFlow',
    inputSchema: EvaluateInterviewResponseInputSchema,
    outputSchema: EvaluateInterviewResponseOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
