"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeHiringOverride = analyzeHiringOverride;
/**
 * @fileOverview A Genkit flow that analyzes an overridden AI decision to suggest rubric refinements.
 *
 * - analyzeHiringOverride - A function that performs root-cause analysis on a hiring decision override.
 * - AnalyzeHiringOverrideInput - The input type for the analyzeHiringOverride function.
 * - AnalyzeHiringOverrideOutput - The return type for the analyzeHiringOverride function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const AnalyzeHiringOverrideInputSchema = genkit_2.z.object({
    candidateProfile: genkit_2.z.object({
        name: genkit_2.z.string(),
        skills: genkit_2.z.array(genkit_2.z.string()),
        narrative: genkit_2.z.string(),
        aiInitialDecision: genkit_2.z.string().describe("The AI's initial recommendation (e.g., 'Reject')."),
        aiInitialScore: genkit_2.z.number().describe("The AI's initial score for the candidate."),
        humanFinalDecision: genkit_2.z.string().describe("The human recruiter's final decision (e.g., 'Hired')."),
    }),
    roleTitle: genkit_2.z.string().describe("The title of the job role."),
    currentRubricWeights: genkit_2.z.string().describe("A description or JSON string of the current scoring rubric weights."),
});
const AnalyzeHiringOverrideOutputSchema = genkit_2.z.object({
    analysis: genkit_2.z.string().describe("A root-cause analysis explaining the likely reason for the discrepancy between the AI and human decisions."),
    suggestedChange: genkit_2.z.string().describe("A specific, actionable suggestion for changing the rubric weights (e.g., 'Increase weight for Skill X by 5%')."),
});
async function analyzeHiringOverride(input) {
    return analyzeHiringOverrideFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'analyzeHiringOverridePrompt',
    input: { schema: AnalyzeHiringOverrideInputSchema },
    output: { schema: AnalyzeHiringOverrideOutputSchema },
    prompt: `You are an AI system auditor. A human recruiter has overridden your initial hiring recommendation. Your task is to perform a root-cause analysis to understand why and suggest a refinement to your own scoring rubric.

**Case Details:**
- Role: {{{roleTitle}}}
- Candidate: {{{candidateProfile.name}}}
- Candidate Skills: {{{candidateProfile.skills}}}
- Candidate Narrative: {{{candidateProfile.narrative}}}
- Your Initial Score: {{{candidateProfile.aiInitialScore}}}
- Your Initial Decision: {{{candidateProfile.aiInitialDecision}}}
- Recruiter's Final Decision: {{{candidateProfile.humanFinalDecision}}}
- Current Rubric Weights: {{{currentRubricWeights}}}

**Task:**
1.  **Analyze the Discrepancy:** Compare the candidate's profile to your initial decision. Identify the most likely attribute or skill that you undervalued, which the human recruiter valued highly. For instance, did you penalize a non-traditional career path that the recruiter saw as a sign of adaptability? Did you undervalue a specific skill that is critical for this role?
2.  **Suggest a Rubric Change:** Based on your analysis, propose a specific, actionable change to the rubric weights to improve future accuracy for this type of role. The suggestion should be clear and concise.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const analyzeHiringOverrideFlow = genkit_1.ai.defineFlow({
    name: 'analyzeHiringOverrideFlow',
    inputSchema: AnalyzeHiringOverrideInputSchema,
    outputSchema: AnalyzeHiringOverrideOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
