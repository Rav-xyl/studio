"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.cultureFitSynthesis = cultureFitSynthesis;
/**
 * @fileOverview A Genkit flow for synthesizing a "Culture Fit" profile for a candidate.
 *
 * - cultureFitSynthesis - A function that analyzes a candidate's qualitative data to assess cultural alignment.
 * - CultureFitSynthesisInput - The input type for the cultureFitSynthesis function.
 * - CultureFitSynthesisOutput - The return type for the cultureFitSynthesis function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const CultureFitSynthesisInputSchema = genkit_2.z.object({
    candidateNarrative: genkit_2.z.string().describe("The AI-generated narrative summary of the candidate's resume."),
    inferredSoftSkills: genkit_2.z.array(genkit_2.z.string()).describe("A list of soft skills inferred by the AI during resume screening."),
    companyValues: genkit_2.z.string().describe("A comma-separated list of the company's core cultural values (e.g., 'Innovation, Collaboration, Customer-Centricity')."),
});
const CultureFitSynthesisOutputSchema = genkit_2.z.object({
    alignmentScore: genkit_2.z.number().describe("A score from 0 to 100 indicating the degree of cultural alignment."),
    summary: genkit_2.z.string().describe("A 2-3 sentence qualitative summary of the candidate's cultural alignment."),
    alignmentBreakdown: genkit_2.z.array(genkit_2.z.object({
        value: genkit_2.z.string().describe("The company value being assessed."),
        evidence: genkit_2.z.string().describe("Specific evidence or indicators from the candidate's profile that support or contradict this value."),
    })).describe("A breakdown of alignment for each company value."),
});
async function cultureFitSynthesis(input) {
    return cultureFitSynthesisFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'cultureFitSynthesisPrompt',
    input: { schema: CultureFitSynthesisInputSchema },
    output: { schema: CultureFitSynthesisOutputSchema },
    prompt: `You are an expert organizational psychologist. Your task is to generate a 'Cultural Alignment Profile' for a candidate based on their resume narrative and inferred soft skills.

**Company Values:**
{{{companyValues}}}

**Candidate Profile:**
- Narrative Summary: {{{candidateNarrative}}}
- Inferred Soft Skills: {{{inferredSoftSkills}}}

**Task:**
1.  **Analyze Alignment:** Evaluate how the candidate's narrative and soft skills align with each of the company's values.
2.  **Score:** Provide an overall alignment score from 0 to 100.
3.  **Summarize:** Write a concise qualitative summary of your findings.
4.  **Breakdown:** For each company value, provide specific evidence from the candidate's profile that supports (or contradicts) their alignment with that value.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const cultureFitSynthesisFlow = genkit_1.ai.defineFlow({
    name: 'cultureFitSynthesisFlow',
    inputSchema: CultureFitSynthesisInputSchema,
    outputSchema: CultureFitSynthesisOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
