'use server';

/**
 * @fileOverview A flow for automated resume screening.
 *
 * - automatedResumeScreening - A function that handles the resume screening process.
 * - AutomatedResumeScreeningInput - The input type for the automatedResumeScreening function.
 * - AutomatedResumeScreeningOutput - The return type for the automatedResumeScreening function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomatedResumeScreeningInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume to screen, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  skillMappings: z.record(z.string(), z.string()).optional().describe('A map of candidate skills to company-preferred skills.'),
  companyPreferences: z.string().optional().describe('Any specific company preferences for candidates.'),
});
export type AutomatedResumeScreeningInput = z.infer<typeof AutomatedResumeScreeningInputSchema>;

const AutomatedResumeScreeningOutputSchema = z.object({
  extractedInformation: z.object({
    name: z.string().describe("The candidate's full name, or the filename if a name cannot be found."),
    email: z.string().optional().describe("The candidate's email address."),
    phone: z.string().optional().describe("The candidate's phone number."),
    skills: z.array(z.string()).describe('A list of skills extracted from the resume.'),
    experience: z.string().describe("A summary of the candidate's experience."),
    narrative: z.string().describe("A 2-3 sentence narrative summary of the candidate's profile."),
    inferredSkills: z.array(z.string()).describe("A list of 2-3 inferred soft skills or related technical skills."),
  }),
  candidateScore: z.number().describe("A score representing the candidate's suitability for the role, between 0 and 100."),
  reasoning: z.string().describe('Explanation of how the candidate score was derived, incorporating skill mappings and company preferences.'),
});
export type AutomatedResumeScreeningOutput = z.infer<typeof AutomatedResumeScreeningOutputSchema>;

export async function automatedResumeScreening(input: AutomatedResumeScreeningInput): Promise<AutomatedResumeScreeningOutput> {
  return automatedResumeScreeningFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automatedResumeScreeningPrompt',
  input: {schema: AutomatedResumeScreeningInputSchema},
  output: {schema: AutomatedResumeScreeningOutputSchema},
  prompt: `You are an expert resume screener for the Indian job market.

  Analyze the provided resume and extract key information such as skills, experience, and any other relevant information.
  Then, score the candidate based on their suitability for a generic role, taking into account any skill mappings and company preferences provided.

  Resume:
  {{media url=resumeDataUri}}

  Skill Mappings (if available):
  {{#if skillMappings}}
  {{skillMappings}}
  {{else}}
  Not provided.
  {{/if}}

  Company Preferences (if available):
  {{#if companyPreferences}}
  {{companyPreferences}}
  {{else}}
  Not provided.
  {{/if}}

  Provide a candidate score and reasoning for the score.
  - Extract the candidate's full name. If not found, use the filename.
  - Extract email and phone if available.
  - Skills should be listed in order of relevance.
  - Experience should be summarized in a succinct paragraph.
  - Create a 2-3 sentence narrative summary.
  - Infer 2-3 relevant soft skills or related technical skills.
  - Candidate score should be between 0 and 100.
  - Reasoning should incorporate skill mappings and company preferences if they are provided.
  - Return your response in JSON format.
  `,
});

const automatedResumeScreeningFlow = ai.defineFlow(
  {
    name: 'automatedResumeScreeningFlow',
    inputSchema: AutomatedResumeScreeningInputSchema,
    outputSchema: AutomatedResumeScreeningOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
