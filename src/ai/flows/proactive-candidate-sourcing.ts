'use server';
/**
 * @fileOverview A flow to proactively source high-potential candidates for open roles.
 *
 * - proactiveCandidateSourcing - A function that identifies strong matches from a pool of candidates.
 * - ProactiveCandidateSourcingInput - The input type for the function.
 * - ProactiveCandidateSourcingOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Candidate, JobRole } from '@/lib/types';

const ProactiveCandidateSourcingInputSchema = z.object({
  candidates: z.array(z.any()).describe("A list of available, unassigned candidate objects."),
  roles: z.array(z.any()).describe("A list of open job role objects."),
});
export type ProactiveCandidateSourcingInput = z.infer<typeof ProactiveCandidateSourcingInputSchema>;


const NotificationSchema = z.object({
    candidateId: z.string(),
    candidateName: z.string(),
    roleId: z.string(),
    roleTitle: z.string(),
    justification: z.string(),
    confidenceScore: z.number(),
    status: z.enum(['pending', 'actioned']).default('pending'),
});

const ProactiveCandidateSourcingOutputSchema = z.object({
  notifications: z.array(NotificationSchema).describe("A list of notifications for high-potential matches to be sent to the admin."),
});
export type ProactiveCandidateSourcingOutput = z.infer<typeof ProactiveCandidateSourcingOutputSchema>;

export async function proactiveCandidateSourcing(input: ProactiveCandidateSourcingInput): Promise<ProactiveCandidateSourcingOutput> {
  return proactiveCandidateSourcingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proactiveCandidateSourcingPrompt',
  input: {schema: ProactiveCandidateSourcingInputSchema},
  output: {schema: ProactiveCandidateSourcingOutputSchema},
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

const proactiveCandidateSourcingFlow = ai.defineFlow(
  {
    name: 'proactiveCandidateSourcingFlow',
    inputSchema: ProactiveCandidateSourcingInputSchema,
    outputSchema: ProactiveCandidateSourcingOutputSchema,
  },
  async input => {
    // This check is important because the LLM can hallucinate if given empty inputs.
    if (input.candidates.length === 0 || input.roles.length === 0) {
        return { notifications: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
