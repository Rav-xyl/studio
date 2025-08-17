'use server';
/**
 * @fileOverview A flow to find potential candidates for a specific job role from a list of candidates.
 *
 * - findPotentialCandidates - A function that suggests suitable candidates for a role.
 * - FindPotentialCandidatesInput - The input type for the function.
 * - FindPotentialCandidatesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CandidateProfileSchema = z.object({
    id: z.string(),
    name: z.string(),
    skills: z.array(z.string()),
    narrative: z.string(),
});

const JobRoleSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
});

const FindPotentialCandidatesInputSchema = z.object({
  jobRole: JobRoleSchema.describe('The job role to find candidates for.'),
  candidates: z.array(CandidateProfileSchema).describe('A list of available candidates to match against.'),
});
export type FindPotentialCandidatesInput = z.infer<typeof FindPotentialCandidatesInputSchema>;

const MatchedCandidateSchema = z.object({
    candidateId: z.string().describe('The ID of the matched candidate.'),
    candidateName: z.string().describe('The name of the matched candidate.'),
    justification: z.string().describe('A brief justification for why this candidate is a good fit.'),
    confidenceScore: z.number().describe('A score from 0 to 100 indicating the confidence in the match.'),
});

const FindPotentialCandidatesOutputSchema = z.object({
  matches: z.array(MatchedCandidateSchema).describe('A list of suitable candidates for the role, sorted by confidence score.'),
});
export type FindPotentialCandidatesOutput = z.infer<typeof FindPotentialCandidatesOutputSchema>;

export async function findPotentialCandidates(input: FindPotentialCandidatesInput): Promise<FindPotentialCandidatesOutput> {
  return findPotentialCandidatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findPotentialCandidatesPrompt',
  input: {schema: FindPotentialCandidatesInputSchema},
  output: {schema: FindPotentialCandidatesOutputSchema},
  config: {
    temperature: 0.1 // Lower temperature for more deterministic, consistent scoring
  },
  prompt: `You are an expert AI recruiter. Your task is to analyze a list of candidates and determine which ones are a good fit for the provided job role.

**Job Role:**
- Title: {{{jobRole.title}}}
- Description: {{{jobRole.description}}}

**Available Candidates:**
{{#each candidates}}
- Candidate ID: {{id}}
  - Name: {{name}}
  - Skills: {{skills}}
  - Narrative: {{narrative}}
---
{{/each}}

**Instructions:**
1.  Carefully review the job role's title and description.
2.  Compare the job role against each of the available candidate profiles.
3.  Identify the top candidates who are the strongest match for this role. Consider both explicit skills and the experience described in their narrative.
4.  For each match, provide a brief justification and a confidence score (0-100). A score above 70 indicates a strong match.
5.  If no candidates are a good fit, return an empty list of matches.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const findPotentialCandidatesFlow = ai.defineFlow(
  {
    name: 'findPotentialCandidatesFlow',
    inputSchema: FindPotentialCandidatesInputSchema,
    outputSchema: FindPotentialCandidatesOutputSchema,
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
