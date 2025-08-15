'use server';
/**
 * @fileOverview A Genkit flow for proactively sourcing potential candidates.
 *
 * - proactiveCandidateSourcing - A function that generates fictional candidate profiles based on open roles.
 * - ProactiveCandidateSourcingInput - The input type for the proactiveCandidateSourcing function.
 * - ProactiveCandidateSourcingOutput - The return type for the proactiveCandidateSourcing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProactiveCandidateSourcingInputSchema = z.object({
  openRoles: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).describe('A list of open job roles to source candidates for.'),
  numberOfCandidates: z.number().describe('The number of candidate profiles to generate.'),
});
export type ProactiveCandidateSourcingInput = z.infer<typeof ProactiveCandidateSourcingInputSchema>;

const SourcedCandidateSchema = z.object({
  name: z.string().describe("A plausible-sounding full name for the fictional candidate."),
  role: z.string().describe("A job title for the fictional candidate, closely matching one of the open roles."),
  skills: z.array(z.string()).describe("A list of 5-7 relevant skills for the role."),
  narrative: z.string().describe("A 2-3 sentence fictional summary of the candidate's experience and career goals."),
  inferredSkills: z.array(z.string()).describe("A list of 2-3 inferred soft skills or related technical skills."),
});

const ProactiveCandidateSourcingOutputSchema = z.object({
  sourcedCandidates: z.array(SourcedCandidateSchema).describe('A list of generated fictional candidate profiles.'),
});
export type ProactiveCandidateSourcingOutput = z.infer<typeof ProactiveCandidateSourcingOutputSchema>;

export async function proactiveCandidateSourcing(input: ProactiveCandidateSourcingInput): Promise<ProactiveCandidateSourcingOutput> {
  return proactiveCandidateSourcingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'proactiveCandidateSourcingPrompt',
  input: {schema: ProactiveCandidateSourcingInputSchema},
  output: {schema: ProactiveCandidateSourcingOutputSchema},
  prompt: `You are a proactive AI sourcing agent for the Indian job market. Your task is to generate {{{numberOfCandidates}}} fictional, yet realistic, candidate profiles that would be a strong fit for the following open roles.

Open Roles:
{{#each openRoles}}
- **{{title}}**: {{description}}
{{/each}}

For each generated candidate, create a plausible name, assign them to one of the roles, and generate a relevant set of skills, a brief narrative summary, and some inferred skills. The profiles should be diverse and reflect the talent pool in India.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const proactiveCandidateSourcingFlow = ai.defineFlow(
  {
    name: 'proactiveCandidateSourcingFlow',
    inputSchema: ProactiveCandidateSourcingInputSchema,
    outputSchema: ProactiveCandidateSourcingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
