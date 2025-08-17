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
    temperature: 0.1, // Lower temperature for more deterministic, consistent scoring
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
1.  **Analyze Holistically:** For each candidate, carefully review their skills and their narrative experience. Do not just count keywords; assess the context provided in the narrative.
2.  **Score with Nuance:** Assign a confidence score from 0-100. Avoid clustering scores around 85. A score of 90+ should be reserved for exceptional candidates who are a near-perfect match. A score of 70-80 is a good, qualified candidate. A score below 60 is a poor match.
3.  **Justify Clearly:** Provide a brief, specific justification for your score.
4.  **Filter Weak Matches:** Only return candidates with a confidence score of 60 or higher.
5.  **Return Top Matches:** If multiple candidates are found, return a list of the most suitable candidates.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const findPotentialCandidatesFlow = ai.defineFlow(
  {
    name: 'findPotentialCandidatesFlow',
    inputSchema: FindPotentialCandidatesInputSchema,
    outputSchema: FindPotentialCandidatesOutputSchema,
  },
  async (input) => {
    if (input.candidates.length === 0) {
      return { matches: [] };
    }
    const { output } = await prompt(input);
    // Sort the matches by confidence score in descending order
    if (output && Array.isArray(output.matches)) {
      output.matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
    } else {
      // Ensure we always return an object with a matches array if the output is malformed
      return { matches: [] };
    }
    return output!;
  }
);
