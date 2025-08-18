"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCandidate = reviewCandidate;
/**
 * @fileOverview AI-Assisted Candidate Review Flow.
 *
 * This flow reviews candidate data and provides a recommendation with justification.
 *
 * @file            ai-assisted-candidate-review.ts
 * @exports       reviewCandidate
 * @exports       ReviewCandidateInput
 * @exports       ReviewCandidateOutput
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const ReviewCandidateInputSchema = genkit_2.z.object({
    candidateData: genkit_2.z.string().describe('The candidate data to review.'),
    jobDescription: genkit_2.z.string().describe('The job description for the role.'),
    companyType: genkit_2.z.enum(['startup', 'enterprise']).describe('The type of company hiring, which dictates the evaluation criteria.'),
});
const ReviewCandidateOutputSchema = genkit_2.z.object({
    recommendation: genkit_2.z.string().describe('The AI recommendation (Hire, Reject, Maybe).'),
    justification: genkit_2.z.string().describe('The justification for the recommendation.'),
});
async function reviewCandidate(input) {
    return reviewCandidateFlow(input);
}
const reviewCandidatePrompt = genkit_1.ai.definePrompt({
    name: 'reviewCandidatePrompt',
    input: { schema: ReviewCandidateInputSchema },
    output: { schema: ReviewCandidateOutputSchema },
    prompt: `You are an AI assistant that reviews candidate data and provides a recommendation based on the company type.

  Company Type: {{{companyType}}}

  **Evaluation Criteria:**
  {{#if companyType.startup}}
  - **Startup Context:** Look for adaptability, potential to grow, and a fit for a fast-paced environment where roles are not rigidly defined. The justification should reflect this. Use normal strictness.
  {{/if}}
  {{#if companyType.enterprise}}
  - **Enterprise Context:** Focus strictly on the alignment of skills and experience with the job description. The justification should be based on proven expertise and qualifications. Use hard strictness as this is role-specific.
  {{/if}}

  Based on the following candidate data:
  {{candidateData}}

  And the following job description:
  {{jobDescription}}

  Provide a recommendation (Hire, Reject, Maybe) and a justification for your recommendation.
  Ensure the recommendation and justification align with the evaluation criteria for the specified company type.
  
  IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.
  `,
});
const reviewCandidateFlow = genkit_1.ai.defineFlow({
    name: 'reviewCandidateFlow',
    inputSchema: ReviewCandidateInputSchema,
    outputSchema: ReviewCandidateOutputSchema,
}, async (input) => {
    const { output } = await reviewCandidatePrompt({
        ...input,
        companyType: {
            [input.companyType]: true,
        },
    });
    return output;
});
