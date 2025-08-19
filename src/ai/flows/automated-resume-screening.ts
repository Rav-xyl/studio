
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
import mammoth from 'mammoth';

const AutomatedResumeScreeningInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume to screen, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
  resumeText: z.string().optional().describe('Extracted text from the resume, if not a direct media type.'),
  skillMappings: z.record(z.string(), z.string()).optional().describe('A map of candidate skills to company-preferred skills.'),
  companyPreferences: z.string().optional().describe('Any specific company preferences for candidates.'),
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
  {{#if resumeText}}
  {{resumeText}}
  {{else}}
  {{media url=resumeDataUri}}
  {{/if}}


  {{#if skillMappings}}
  **Skill Mappings:**
  {{{skillMappings}}}
  {{/if}}

  {{#if companyPreferences}}
  **Company Preferences:**
  {{{companyPreferences}}}
  {{/if}}

  **Extraction Rules:**
  - **Name:** Extract the candidate's full name. If not found, use the filename from the original upload.
  - **Contact Info:** Extract email and phone if available. Find one social media or portfolio URL (LinkedIn, GitHub, Personal Website etc.) if available.
  - **Skills:** Extract only the skills explicitly listed or mentioned in the resume. List them in order of relevance. Do not invent skills.
  - **Experience:** Summarize the candidate's work experience in a succinct paragraph.
  - **Narrative:** Create a 2-3 sentence professional summary based *only* on the information in the resume.
  - **Inferred Skills:** Infer 2-3 relevant soft skills (e.g., "Leadership", "Team Collaboration") or related technical skills based on project descriptions and work history.
  - **Candidate Score:** Score between 0 and 100 based on the specified company context.
  - **Reasoning:** Explain how the score was derived, strictly following the evaluation criteria for the given company type. Incorporate skill mappings and company preferences if provided.
  
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
    const promptInput = { ...input };

    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docMimeType = 'application/msword';
    const mimeType = input.resumeDataUri.split(';')[0].split(':')[1];

    if (mimeType === docxMimeType || mimeType === docMimeType) {
      const base64Data = input.resumeDataUri.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const { value } = await mammoth.extractRawText({ buffer });
      promptInput.resumeText = value;
    }

    const { output } = await prompt({
      ...promptInput,
      companyType: {
        [input.companyType]: true,
      } as any,
    });
    return output!;
  }
);

    