"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSystemDesignQuestion = generateSystemDesignQuestion;
/**
 * @fileOverview This file defines a Genkit flow for generating a system design interview question.
 *
 * - generateSystemDesignQuestion - A function to generate a question based on a role.
 * - GenerateSystemDesignQuestionInput - The input type for the function.
 * - GenerateSystemDesignQuestionOutput - The output type for the function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const GenerateSystemDesignQuestionInputSchema = genkit_2.z.object({
    jobTitle: genkit_2.z.string().describe('The title of the job the candidate is interviewing for.'),
});
const GenerateSystemDesignQuestionOutputSchema = genkit_2.z.object({
    question: genkit_2.z.string().describe('The generated system design question.'),
});
async function generateSystemDesignQuestion(input) {
    return generateSystemDesignQuestionFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'generateSystemDesignQuestionPrompt',
    input: { schema: GenerateSystemDesignQuestionInputSchema },
    output: { schema: GenerateSystemDesignQuestionOutputSchema },
    prompt: `You are an expert interviewer at a top tech company. Generate one complex, open-ended system design question appropriate for a candidate applying for the role of {{{jobTitle}}}.

The question should require the candidate to think about scalability, reliability, and architecture. Avoid simple coding questions.

Example for "Senior Backend Engineer": "Design a real-time notification system for a social media platform with millions of users."
Example for "Lead Data Scientist": "Design the data architecture for a personalized content recommendation engine."

Generate a single question for the specified job title.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const generateSystemDesignQuestionFlow = genkit_1.ai.defineFlow({
    name: 'generateSystemDesignQuestionFlow',
    inputSchema: GenerateSystemDesignQuestionInputSchema,
    outputSchema: GenerateSystemDesignQuestionOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
