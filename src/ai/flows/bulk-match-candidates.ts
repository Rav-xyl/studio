
'use server';

/**
 * @fileOverview A flow to efficiently match a list of candidates to a list of roles in a single AI call.
 *
 * - bulkMatchCandidatesToRoles - A function that suggests suitable roles for multiple candidates.
 * - BulkMatchCandidatesInput - The input type for the function.
 * - BulkMatchCandidatesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobRoleSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
});

const CandidateProfileSchema = z.object({
    id: z.string(),
    skills: z.array(z.string()),
    narrative: z.string(),
});

const BulkMatchCandidatesInputSchema = z.object({
  candidates: z.array(CandidateProfileSchema).describe('A list of available candidates to match.'),
  jobRoles: z.array(JobRoleSchema).describe('A list of available job roles to match against.'),
});
export type BulkMatchCandidatesInput = z.infer<typeof BulkMatchCandidatesInputSchema>;

const MatchedRoleSchema = z.object({
    roleId: z.string().describe('The ID of the matched role.'),
    roleTitle: z.string().describe('The title of the matched role.'),
    justification: z.string().describe('A brief justification for why this role is a good fit.'),
    confidenceScore: z.number().describe('A score from 0 to 100 indicating the confidence in the match.'),
});

const CandidateMatchResultSchema = z.object({
    candidateId: z.string(),
    matches: z.array(MatchedRoleSchema),
});

const BulkMatchCandidatesOutputSchema = z.object({
  results: z.array(CandidateMatchResultSchema).describe('A list of match results for each candidate.'),
});
export type BulkMatchCandidatesOutput = z.infer<typeof BulkMatchCandidatesOutputSchema>;

export async function bulkMatchCandidatesToRoles(input: BulkMatchCandidatesInput): Promise<BulkMatchCandidatesOutput> {
  return bulkMatchCandidatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'bulkMatchCandidatesPrompt',
  input: {schema: BulkMatchCandidatesInputSchema},
  output: {schema: BulkMatchCandidatesOutputSchema},
  config: {
    temperature: 0.1,
  },
  prompt: `You are an expert AI recruiter performing a large-scale matching operation. Your task is to analyze a list of candidates and match each one against a list of available job roles.

**Available Job Roles:**
{{#each jobRoles}}
- Role ID: {{id}}
  - Title: {{title}}
  - Description: {{description}}
---
{{/each}}

**Available Candidates:**
{{#each candidates}}
- Candidate ID: {{id}}
  - Skills: {{skills}}
  - Narrative Summary: {{narrative}}
---
{{/each}}

**Instructions:**
1.  **Iterate Through Each Candidate:** For every single candidate provided, you must perform the matching process.
2.  **Compare Against All Roles:** For each candidate, compare their profile against all available job roles.
3.  **Identify Top Matches:** For each candidate, identify the top 1-3 roles that are the strongest match.
4.  **Score and Justify:** For each match you find, provide a brief justification and a confidence score (0-100). A score above 70 indicates a strong match.
5.  **Compile Results:** Structure your final output as a list of results, where each item in the list corresponds to one candidate and contains their ID and their list of matched roles.
6.  If a candidate is not a good fit for any role, return an empty list of matches for that candidate's result.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const bulkMatchCandidatesFlow = ai.defineFlow(
  {
    name: 'bulkMatchCandidatesFlow',
    inputSchema: BulkMatchCandidatesInputSchema,
    outputSchema: BulkMatchCandidatesOutputSchema,
  },
  async input => {
    if (input.candidates.length === 0 || input.jobRoles.length === 0) {
        return { results: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
