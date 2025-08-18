"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInterviewQuestions = generateInterviewQuestions;
/**
 * @fileOverview This file defines a Genkit flow for generating dynamic interview questions based on candidate resume and role requirements.
 *
 * - generateInterviewQuestions - A function that generates customized interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const GenerateInterviewQuestionsInputSchema = genkit_2.z.object({
    resumeText: genkit_2.z.string().describe('The text content of the candidate\'s resume.'),
    jobDescription: genkit_2.z.string().describe('The job description for the role.'),
    candidateAnalysis: genkit_2.z.string().describe('Deep review analysis of the candidate.'),
});
const GenerateInterviewQuestionsOutputSchema = genkit_2.z.object({
    questions: genkit_2.z.array(genkit_2.z.string()).describe('A list of dynamically generated interview questions.'),
});
async function generateInterviewQuestions(input) {
    return generateInterviewQuestionsFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'dynamicInterviewQuestionPrompt',
    input: { schema: GenerateInterviewQuestionsInputSchema },
    output: { schema: GenerateInterviewQuestionsOutputSchema },
    prompt: `You are an expert recruiter. Generate a set of interview questions tailored to the candidate and the role they are assigned to.

Candidate Resume:
{{{resumeText}}}

Job Description for the Assigned Role:
{{{jobDescription}}}

Candidate Analysis:
{{{candidateAnalysis}}}

Generate 5-7 interview questions that probe specific areas of the candidate's profile and assess their suitability for the specific role defined in the job description. Ensure that questions are open-ended and encourage the candidate to elaborate on their experiences and skills.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const generateInterviewQuestionsFlow = genkit_1.ai.defineFlow({
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
