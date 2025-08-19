
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
  fileName: z.string().describe("The original filename of the resume, to be used as a fallback for the candidate's name if it cannot be extracted from the document."),
  companyType: z.enum(['startup', 'enterprise']).describe('The type of company hiring, which dictates the evaluation criteria.'),
});
export type AutomatedResumeScreeningInput = z.infer<typeof AutomatedResumeScreeningInputSchema>;

const AutomatedResumeScreeningOutputSchema = z.object({
  extractedInformation: z.object({
    name: z.string().describe("The candidate's full name, or the filename if a name cannot be found."),
    email: z.string().optional().describe("The candidate's email address."),
    phone: z.string().optional().describe("The candidate's phone number."),
    socialUrl: z.string().optional().describe("A social profile URL (e.g., LinkedIn, GitHub) found in the resume."),
    skills: z.array(z.string()).describe('A list of skills extracted from the resume.'),
    experience: z.string().describe("A summary of the candidate's experience."),
    narrative: z.string().describe("A 2-3 sentence narrative summary of the candidate's profile."),
    inferredSkills: z.array(z.string()).describe("A list of 2-3 inferred soft skills or related technical skills."),
    cgpa: z.number().optional().describe("The candidate's CGPA or equivalent score if mentioned. Must be a number between 0 and 10."),
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
  prompt: `You are an expert resume screening AI for the Indian job market. Your primary goal is ACCURACY and CONSISTENCY. You must act as a precise data parser first and an analyst second. Do not hallucinate or invent information.

  You will adapt your evaluation based on the company type provided.

  Company Type: {{{companyType}}}

  **Evaluation Criteria:**
  {{#if companyType.startup}}
  - **Startup Context:** Prioritize adaptability, a broad range of skills, and signs of a proactive, "all-rounder" mindset. Be more lenient on formal education or linear career paths. Look for evidence of self-starting and wearing multiple hats. Use normal strictness.
  {{/if}}
  {{#if companyType.enterprise}}
  - **Enterprise Context:** Prioritize deep, role-specific experience, stability in previous roles, and strong formal qualifications (e.g., specific degrees, certifications). Value specialized expertise over broad, general skills. Use hard strictness as this is role-specific.
  {{/if}}

  **Execution Steps:**
  1.  **Parse Systematically:** Analyze the provided resume. Extract key information with extreme precision.
  2.  **Score Candidate:** Score the candidate based on their suitability for a generic role within the specified company context, using the evaluation criteria.
  3.  **Format Output:** Structure your entire response in the required JSON format.

  **Resume Content:**
  {{media url=resumeDataUri}}

  **Extraction Rules:**
  - **Name:** Extract the candidate's full name. If a name is not found, you MUST use the provided filename as the fallback: {{{fileName}}}
  - **Contact Info:** Extract email and phone if available. Find one social media or portfolio URL (LinkedIn, GitHub, Personal Website etc.) if available.
  - **Skills:** Extract only the skills explicitly listed or mentioned in the resume. List them in order of relevance. Do not invent skills.
  - **Experience:** Summarize the candidate's work experience in a succinct paragraph.
  - **Narrative:** Create a 2-3 sentence professional summary based *only* on the information in the resume.
  - **Inferred Skills:** Infer 2-3 relevant soft skills (e.g., "Leadership", "Team Collaboration") or related technical skills based on project descriptions and work history.
  - **CGPA:** Find the candidate's CGPA or equivalent grade. This is CRITICAL. A CGPA is usually on a scale of 4 or 10. A percentage is on a scale of 100.
    - If you find a percentage (e.g., "89.2%"), you MUST convert it to a 10-point scale (e.g., 8.92).
    - If you find a CGPA on a 10-point scale (e.g., "8.5/10"), extract the number directly (8.5).
    - If you find a CGPA on a 4-point scale (e.g., "3.8/4.0"), convert it to a 10-point scale (e.g., 9.5).
    - The final extracted value MUST be a number between 0 and 10. If no score is found, do not include the field.
  - **Candidate Score:** Score between 0 and 100 based on the specified company context.
  - **Reasoning:** Explain how the score was derived, strictly following the evaluation criteria for the given company type.
  
  IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object. Your primary directive is to be consistent and accurate.
  `,
});

const automatedResumeScreeningFlow = ai.defineFlow(
  {
    name: 'automatedResumeScreeningFlow',
    inputSchema: AutomatedResumeScreeningInputSchema,
    outputSchema: AutomatedResumeScreeningOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      ...input,
      companyType: {
        [input.companyType]: true,
      } as any,
    });
    return output!;
  }
);
