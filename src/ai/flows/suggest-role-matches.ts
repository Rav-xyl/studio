'use server';

/**
 * @fileOverview A flow to suggest relevant roles for a candidate based on their profile.
 *
 * - suggestRoleMatches - A function that suggests 2-3 relevant roles for a candidate.
 * - SuggestRoleMatchesInput - The input type for the suggestRoleMatches function.
 * - SuggestRoleMatchesOutput - The return type for the suggestRoleMatches function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRoleMatchesInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate.'),
  candidateSkills: z.string().describe('The skills of the candidate.'),
  candidateNarrative: z.string().describe('A narrative description of the candidate.'),
  candidateInferredSkills: z.string().describe('Inferred skills of the candidate.'),
});
export type SuggestRoleMatchesInput = z.infer<typeof SuggestRoleMatchesInputSchema>;

const SuggestRoleMatchesOutputSchema = z.object({
  roles: z.array(
    z.object({
      roleTitle: z.string().describe('The title of the suggested role.'),
      rationale: z.string().describe('The rationale for suggesting this role.'),
    })
  ).describe('A list of suggested roles for the candidate.'),
});
export type SuggestRoleMatchesOutput = z.infer<typeof SuggestRoleMatchesOutputSchema>;

export async function suggestRoleMatches(input: SuggestRoleMatchesInput): Promise<SuggestRoleMatchesOutput> {
  return suggestRoleMatchesFlow(input);
}

const suggestRoleMatchesPrompt = ai.definePrompt({
  name: 'suggestRoleMatchesPrompt',
  input: {schema: SuggestRoleMatchesInputSchema},
  output: {schema: SuggestRoleMatchesOutputSchema},
  prompt: `You are an expert recruiter. Given the following candidate profile, suggest 2-3 relevant roles.

Candidate Name: {{{candidateName}}}
Candidate Skills: {{{candidateSkills}}}
Candidate Narrative: {{{candidateNarrative}}}
Candidate Inferred Skills: {{{candidateInferredSkills}}}

For each role, provide a rationale for why the role is a good fit for the candidate.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const suggestRoleMatchesFlow = ai.defineFlow(
  {
    name: 'suggestRoleMatchesFlow',
    inputSchema: SuggestRoleMatchesInputSchema,
    outputSchema: SuggestRoleMatchesOutputSchema,
  },
  async input => {
    const {output} = await suggestRoleMatchesPrompt(input);
    return output!;
  }
);
