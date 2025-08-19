// This file is machine-generated - edit with care!

'use server';

/**
 * @fileOverview AI-driven candidate engagement flow. 
 *
 * - aiDrivenCandidateEngagement - A function that generates personalized emails to candidates based on their stage in the hiring process.
 * - AiDrivenCandidateEngagementInput - The input type for the aiDrivenCandidateEngagement function.
 * - AiDrivenCandidateEngagementOutput - The return type for the aiDrivenCandidateEngagement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDrivenCandidateEngagementInputSchema = z.object({
  candidateName: z.string().describe('The name of the candidate.'),
  candidateStage: z.string().describe('The current stage of the candidate in the hiring process (e.g., Eligible for Role, AI Video Interview Scheduled, Offer Extended, Rejected, Gauntlet Deadline Approaching).'),
  jobTitle: z.string().describe('The title of the job the candidate is applying for.'),
  companyName: z.string().describe('The name of the company.'),
  recruiterName: z.string().describe('The name of the recruiter.'),
  candidateSkills: z.string().describe('The skills of the candidate.'),
  rejectionReason: z.string().optional().describe('The reason for rejection, if the candidate is in the Rejected stage.'),
});

export type AiDrivenCandidateEngagementInput = z.infer<typeof AiDrivenCandidateEngagementInputSchema>;

const AiDrivenCandidateEngagementOutputSchema = z.object({
  emailSubject: z.string().describe('The subject of the email.'),
  emailBody: z.string().describe('The body of the personalized email.'),
});

export type AiDrivenCandidateEngagementOutput = z.infer<typeof AiDrivenCandidateEngagementOutputSchema>;

export async function aiDrivenCandidateEngagement(input: AiDrivenCandidateEngagementInput): Promise<AiDrivenCandidateEngagementOutput> {
  return aiDrivenCandidateEngagementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDrivenCandidateEngagementPrompt',
  input: {schema: AiDrivenCandidateEngagementInputSchema},
  output: {schema: AiDrivenCandidateEngagementOutputSchema},
  prompt: `You are an AI assistant specializing in drafting personalized and professional emails for recruiters to send to candidates during the hiring process. Your goal is to automate candidate communication and improve their experience.

  Based on the candidate's current stage, generate an appropriate email subject and body.

  Here are the details:
  Candidate Name: {{{candidateName}}}
  Candidate Stage: {{{candidateStage}}}
  Job Title: {{{jobTitle}}}
  Company Name: {{{companyName}}}
  Recruiter Name: {{{recruiterName}}}
  Candidate Skills: {{{candidateSkills}}}
  Rejection Reason (if applicable): {{#if rejectionReason}}{{{rejectionReason}}}{{else}}N/A{{/if}}

  Here are example emails for different stages (these should be used as inspiration and should not be copied verbatim):

  Stage: Gauntlet Deadline Approaching
  Subject: Friendly Reminder: Your AI Gauntlet with {{{companyName}}}
  Body: Dear {{{candidateName}}},

  This is a friendly reminder that your window to complete the AI Gauntlet for the {{{jobTitle}}} position is closing soon. We are very interested in your profile and look forward to seeing your submission.

  If you have any technical issues, please don't hesitate to reach out.

  Best,
  {{{recruiterName}}}

  Stage: Eligible for Role
  Subject: Exciting Opportunity at {{{companyName}}} - {{{jobTitle}}} Role
  Body: Dear {{{candidateName}}},

  We are excited to inform you that you are eligible for the {{{jobTitle}}} position at {{{companyName}}}. Your skills and experience align well with the requirements of this role. We would like to invite you to the next stage of the hiring process.

  Please let us know if you are interested in proceeding.

  Sincerely,
  {{{recruiterName}}}

  Stage: AI Video Interview Scheduled
  Subject: Your AI Video Interview with {{{companyName}}}
  Body: Dear {{{candidateName}}},

  This email confirms your AI video interview scheduled with {{{companyName}}}. Please ensure you have a stable internet connection and a working webcam.

  We wish you the best of luck!

  Sincerely,
  {{{recruiterName}}}

  Stage: Offer Extended
  Subject: Offer for {{{jobTitle}}} Role at {{{companyName}}}
  Body: Dear {{{candidateName}}},

  We are pleased to extend an offer for the {{{jobTitle}}} role at {{{companyName}}}. Please review the attached offer letter and let us know if you have any questions.

  We look forward to welcoming you to our team!

  Sincerely,
  {{{recruiterName}}}

  Stage: Rejected
  Subject: Update on your application for {{{jobTitle}}} at {{{companyName}}}
  Body: Dear {{{candidateName}}},

  Thank you for your interest in the {{{jobTitle}}} position at {{{companyName}}}. After careful consideration, we have decided to move forward with other candidates whose qualifications and experience more closely align with the requirements of this role. 
  {{{rejectionReason}}}

  We appreciate your time and effort in applying and wish you the best in your job search.

  Sincerely,
  {{{recruiterName}}}

  Based on the details and examples above, please generate the email subject and body.
  
  IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.
  `,
});

const aiDrivenCandidateEngagementFlow = ai.defineFlow(
  {
    name: 'aiDrivenCandidateEngagementFlow',
    inputSchema: AiDrivenCandidateEngagementInputSchema,
    outputSchema: AiDrivenCandidateEngagementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    