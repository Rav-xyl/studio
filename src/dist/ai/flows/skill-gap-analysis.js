"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.skillGapAnalysis = skillGapAnalysis;
/**
 * @fileOverview A Genkit flow for analyzing skill gaps and suggesting training.
 *
 * - skillGapAnalysis - A function that identifies skill gaps and suggests improvements.
 * - SkillGapAnalysisInput - The input type for the skillGapAnalysis function.
 * - SkillGapAnalysisOutput - The return type for the skillGapAnalysis function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const SkillGapAnalysisInputSchema = genkit_2.z.object({
    candidateSkills: genkit_2.z.array(genkit_2.z.string()).describe("The candidate's current list of skills."),
    jobDescription: genkit_2.z.string().describe('The job description for the target role.'),
});
const SkillGapSchema = genkit_2.z.object({
    skill: genkit_2.z.string().describe('The skill that is missing or needs improvement.'),
    suggestion: genkit_2.z.string().describe('A specific, actionable recommendation for how the candidate can acquire this skill (e.g., a specific online course, certification, or type of project).'),
});
const SkillGapAnalysisOutputSchema = genkit_2.z.object({
    skillGaps: genkit_2.z.array(SkillGapSchema).describe("A list of identified skill gaps and actionable training suggestions."),
});
async function skillGapAnalysis(input) {
    return skillGapAnalysisFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'skillGapAnalysisPrompt',
    input: { schema: SkillGapAnalysisInputSchema },
    output: { schema: SkillGapAnalysisOutputSchema },
    prompt: `You are an AI career coach. Analyze the gap between the candidate's skills and the requirements of the job description.

Candidate's Skills:
{{{candidateSkills}}}

Job Description:
{{{jobDescription}}}

Task:
Identify the top 2-3 most critical skills the candidate is missing or could improve upon to better fit this role. For each identified gap, provide a specific, actionable suggestion for upskilling, such as an online course, a certification, or a type of project to build.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const skillGapAnalysisFlow = genkit_1.ai.defineFlow({
    name: 'skillGapAnalysisFlow',
    inputSchema: SkillGapAnalysisInputSchema,
    outputSchema: SkillGapAnalysisOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
