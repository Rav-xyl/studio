"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftOfferLetter = draftOfferLetter;
/**
 * @fileOverview A Genkit flow for autonomously drafting a competitive job offer.
 *
 * - draftOfferLetter - A function that generates a job offer letter with salary and benefits.
 * - DraftOfferLetterInput - The input type for the draftOfferLetter function.
 * - DraftOfferLetterOutput - The return type for the draftOfferLetter function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const DraftOfferLetterInputSchema = genkit_2.z.object({
    candidateName: genkit_2.z.string().describe("The candidate's full name."),
    roleTitle: genkit_2.z.string().describe("The title of the job role."),
    candidateSkills: genkit_2.z.array(genkit_2.z.string()).describe("A list of the candidate's key skills."),
    candidateExperience: genkit_2.z.string().describe("A summary of the candidate's experience level."),
    companyName: genkit_2.z.string().describe("The name of the company."),
    companySalaryBands: genkit_2.z.string().describe("A description of the company's pre-approved salary bands for this role (e.g., 'Senior Level: $100k-$120k')."),
    simulatedMarketData: genkit_2.z.string().describe("Simulated external market data for this role (e.g., 'Average market rate for this role is $110k')."),
});
const DraftOfferLetterOutputSchema = genkit_2.z.object({
    suggestedSalary: genkit_2.z.string().describe("The suggested competitive annual salary."),
    benefitsPackage: genkit_2.z.array(genkit_2.z.string()).describe("A list of suggested benefits."),
    offerLetterBody: genkit_2.z.string().describe("The full text of the drafted offer letter, including a compelling narrative."),
});
async function draftOfferLetter(input) {
    return draftOfferLetterFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'draftOfferLetterPrompt',
    input: { schema: DraftOfferLetterInputSchema },
    output: { schema: DraftOfferLetterOutputSchema },
    prompt: `You are an expert HR compensation analyst and negotiator. Your task is to autonomously draft a competitive job offer for a candidate.

Analyze the following information:
- Candidate: {{{candidateName}}}
- Role: {{{roleTitle}}}
- Skills & Experience: {{{candidateSkills}}}, {{{candidateExperience}}}
- Company: {{{companyName}}}
- Internal Salary Bands: {{{companySalaryBands}}}
- External Market Data: {{{simulatedMarketData}}}

**Task:**
1.  **Determine Salary:** Based on the candidate's skills, experience, internal bands, and external market data, determine a competitive and fair salary.
2.  **Suggest Benefits:** Provide a standard, attractive benefits package.
3.  **Draft Offer Letter:** Write a compelling offer letter. It should congratulate the candidate, clearly state the role, salary, and benefits, and include a persuasive closing statement about why they are a great fit for {{{companyName}}}.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});
const draftOfferLetterFlow = genkit_1.ai.defineFlow({
    name: 'draftOfferLetterFlow',
    inputSchema: DraftOfferLetterInputSchema,
    outputSchema: DraftOfferLetterOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
