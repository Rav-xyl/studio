'use server';

/**
 * @fileOverview A flow to find potential roles for a candidate from a list of job descriptions.
 *
 * - findPotentialRoles - A function that suggests suitable roles for a candidate.
 * - FindPotentialRolesInput - The input type for the function.
 * - FindPotentialRolesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobRoleSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
});

const CandidateProfileSchema = z.object({
    skills: z.array(z.string()),
    narrative: z.string(),
});

const FindPotentialRolesInputSchema = z.object({
  candidateProfile: CandidateProfileSchema.describe('The profile of the candidate to match.'),
  jobRoles: z.array(JobRoleSchema).describe('A list of available job roles to match against.'),
});
export type FindPotentialRolesInput = z.infer<typeof FindPotentialRolesInputSchema>;

const MatchedRoleSchema = z.object({
    roleId: z.string().describe('The ID of the matched role.'),
    roleTitle: z.string().describe('The title of the matched role.'),
    justification: z.string().describe('A brief justification for why this role is a good fit.'),
    confidenceScore: z.number().describe('A score from 0 to 100 indicating the confidence in the match.'),
});

const FindPotentialRolesOutputSchema = z.object({
  matches: z.array(MatchedRoleSchema).describe('A list of suitable roles for the candidate, sorted by confidence score.'),
});
export type FindPotentialRolesOutput = z.infer<typeof FindPotentialRolesOutputSchema>;

export async function findPotentialRoles(input: FindPotentialRolesInput): Promise<FindPotentialRolesOutput> {
  return findPotentialRolesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findPotentialRolesPrompt',
  input: {schema: FindPotentialRolesInputSchema},
  output: {schema: FindPotentialRolesOutputSchema},
  prompt: `You are an expert AI recruiter. Your task is to analyze a candidate's profile and determine which of the available job roles are a good fit for them.

**Candidate Profile:**
- Skills: {{{candidateProfile.skills}}}
- Narrative Summary: {{{candidateProfile.narrative}}}

**Available Job Roles:**
{{#each jobRoles}}
- Role ID: {{id}}
  - Title: {{title}}
  - Description: {{description}}
---
{{/each}}

**Instructions:**
1.  Carefully review the candidate's skills and experience narrative.
2.  Compare the candidate's profile against each of the available job roles.
3.  Identify the top 1-3 roles that are the strongest match.
4.  For each match, provide a brief justification and a confidence score (0-100). A score above 70 indicates a strong match.
5.  If no roles are a good fit, return an empty list of matches.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const findPotentialRolesFlow = ai.defineFlow(
  {
    name: 'findPotentialRolesFlow',
    inputSchema: FindPotentialRolesInputSchema,
    outputSchema: FindPotentialRolesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Sort the matches by confidence score in descending order
    if (output && output.matches) {
        output.matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
    }
    return output!;
  }
);
