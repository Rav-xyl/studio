
'use server';
/**
 * @fileOverview A Genkit flow for running a system-wide audit of the hiring pipeline.
 *
 * - runSystemAudit - A function that analyzes the state of candidates and roles.
 * - SystemAuditInput - The input type for the function.
 * - SystemAuditOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Candidate, JobRole } from '@/lib/types';

const SystemAuditInputSchema = z.object({
  candidates: z.array(z.any()).describe("A list of all candidate objects in the system."),
  roles: z.array(z.any()).describe("A list of all open job role objects."),
});
export type SystemAuditInput = z.infer<typeof SystemAuditInputSchema>;

const AuditCheckSchema = z.object({
    checkName: z.string().describe('The name of the audit check performed.'),
    status: z.enum(['Success', 'Warning', 'Failure']).describe('The status of the check.'),
    description: z.string().describe('A detailed description of the findings for this check.'),
});

const SystemAuditOutputSchema = z.object({
  overallStatus: z.string().describe("A high-level summary of the pipeline's health."),
  checks: z.array(AuditCheckSchema).describe("A list of individual audit checks and their results."),
});
export type SystemAuditOutput = z.infer<typeof SystemAuditOutputSchema>;

export async function runSystemAudit(input: SystemAuditInput): Promise<SystemAuditOutput> {
  return runSystemAuditFlow(input);
}

const prompt = ai.definePrompt({
  name: 'runSystemAuditPrompt',
  input: {schema: SystemAuditInputSchema},
  output: {schema: SystemAuditOutputSchema},
  prompt: `You are SAARTHI, an AI system auditor. Your task is to perform a comprehensive health check of the entire recruitment pipeline based on the provided data.

**Current System State:**
- Total Candidates: {{{candidates.length}}}
- Total Open Roles: {{{roles.length}}}

**Instructions:**
Perform the following checks and provide a status (Success, Warning, Failure) and a detailed description for each.

1.  **Candidate Pool Health:**
    - Analyze the distribution of candidates across the pipeline stages (Sourcing, Screening, Interview, Hired).
    - Is the pool healthy? Is there a good flow of candidates, or are there bottlenecks?
    - Check for a high number of stalled or unassigned candidates.

2.  **Role Quality Check:**
    - Review the list of open roles. Are there roles with zero assigned candidates for a long time?
    - Are the job descriptions clear and well-defined? (You can infer this from the titles and descriptions).

3.  **Efficiency Analysis:**
    - Identify potential inefficiencies. For example, is there a very high ratio of screened candidates to interview invitations, suggesting the screening criteria might be too broad?
    - Note any positive efficiency trends, like a high number of recent hires.

4.  **Data Integrity:**
    - Scan for any obvious data inconsistencies (e.g., candidates marked as 'Hired' but not assigned to a role). This is a basic check.

**Final Output:**
Based on your analysis, provide a high-level summary of the pipeline's health and the detailed results for each of the four checks.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const runSystemAuditFlow = ai.defineFlow(
  {
    name: 'runSystemAuditFlow',
    inputSchema: SystemAuditInputSchema,
    outputSchema: SystemAuditOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
