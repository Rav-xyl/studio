"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.proactiveCandidateSourcing = proactiveCandidateSourcing;
/**
 * @fileOverview A flow to proactively source high-potential candidates for open roles.
 *
 * - proactiveCandidateSourcing - A function that identifies strong matches from a pool of candidates.
 * - ProactiveCandidateSourcingInput - The input type for the function.
 * - ProactiveCandidateSourcingOutput - The return type for the function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const ProactiveCandidateSourcingInputSchema = genkit_2.z.object({
    candidates: genkit_2.z.array(genkit_2.z.any()).describe("A list of available, unassigned candidate objects."),
    roles: genkit_2.z.array(genkit_2.z.any()).describe("A list of open job role objects."),
});
const NotificationSchema = genkit_2.z.object({
    candidateId: genkit_2.z.string(),
    candidateName: genkit_2.z.string(),
    roleId: genkit_2.z.string(),
    roleTitle: genkit_2.z.string(),
    justification: genkit_2.z.string(),
    confidenceScore: genkit_2.z.number(),
    status: genkit_2.z.enum(['pending', 'actioned']).default('pending'),
});
const ProactiveCandidateSourcingOutputSchema = genkit_2.z.object({
    notifications: genkit_2.z.array(NotificationSchema).describe("A list of notifications for high-potential matches to be sent to the admin."),
});
async function proactiveCandidateSourcing(input) {
    return proactiveCandidateSourcingFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'proactiveCandidateSourcingPrompt',
    input: { schema: ProactiveCandidateSourcingInputSchema },
    output: { schema: ProactiveCandidateSourcingOutputSchema },
    config: {
        temperature: 0.2, // Low temperature for consistent, high-confidence results
    },
    prompt: `You are an expert AI Sourcing Agent. Your task is to analyze a list of unassigned candidates and a list of open roles, and identify only the most exceptional matches that require immediate attention from a human recruiter.

**Open Roles:**
{{#each roles}}
- Role ID: {{id}}
  - Title: {{title}}
  - Description: {{description}}
---
{{/each}}

**Available Unassigned Candidates:**
{{#each candidates}}
- Candidate ID: {{id}}
  - Name: {{name}}
  - Skills: {{skills}}
  - Narrative: {{narrative}}
---
{{/each}}

**Instructions:**
1.  **Iterate Through Each Role:** For each open role, scan through all available candidates.
2.  **Identify Top Talent:** Identify candidates who are an exceptionally strong fit for a role. A strong fit is defined as a confidence score of **85 or higher**.
3.  **Generate Notifications:** For each exceptional match found, create a notification object. The justification should be concise and compelling, explaining *why* this match is so strong (e.g., "Perfect overlap of required skills and 5+ years of relevant experience.").
4.  **Return Only Exceptional Matches:** Only return notifications for candidates who meet the 85+ confidence score threshold. If no such candidates exist, return an empty list of notifications.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const proactiveCandidateSourcingFlow = genkit_1.ai.defineFlow({
    name: 'proactiveCandidateSourcingFlow',
    inputSchema: ProactiveCandidateSourcingInputSchema,
    outputSchema: ProactiveCandidateSourcingOutputSchema,
}, async (input) => {
    // This check is important because the LLM can hallucinate if given empty inputs.
    if (input.candidates.length === 0 || input.roles.length === 0) {
        return { notifications: [] };
    }
    const { output } = await prompt(input);
    return output;
});
