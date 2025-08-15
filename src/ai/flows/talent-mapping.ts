'use server';
/**
 * @fileOverview A Genkit flow for generating a global talent map.
 *
 * - generateTalentMap - A function that identifies talent hotspots based on simulated market data.
 * - GenerateTalentMapInput - The input type for the generateTalentMap function.
 * - GenerateTalentMapOutput - The return type for the generateTalentMap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTalentMapInputSchema = z.object({
  openRoles: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).describe('A list of currently open job roles.'),
  internalHiringData: z.string().describe("A summary of the company's internal hiring data and locations."),
});
export type GenerateTalentMapInput = z.infer<typeof GenerateTalentMapInputSchema>;

const TalentHotspotSchema = z.object({
    location: z.string().describe("The city or region identified as a talent hotspot (e.g., 'Bangalore, India')."),
    talentCount: z.number().describe("A simulated number representing the relative size of the talent pool in this location."),
    topSkills: z.array(z.string()).describe("The top 3-5 skills prevalent in this location's talent pool."),
});

const GenerateTalentMapOutputSchema = z.object({
  hotspots: z.array(TalentHotspotSchema).describe("A list of identified talent hotspots."),
  strategicRecommendation: z.string().describe("A high-level strategic recommendation for the company's talent acquisition strategy based on the map."),
});
export type GenerateTalentMapOutput = z.infer<typeof GenerateTalentMapOutputSchema>;

export async function generateTalentMap(input: GenerateTalentMapInput): Promise<GenerateTalentMapOutput> {
  return generateTalentMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTalentMapPrompt',
  input: {schema: GenerateTalentMapInputSchema},
  output: {schema: GenerateTalentMapOutputSchema},
  prompt: `You are a market intelligence analyst for the Indian job market. Your task is to generate a 'Global Talent Map' by identifying talent hotspots based on open roles and simulated market data.

**Open Roles:**
{{#each openRoles}}
- **{{title}}**: {{description}}
{{/each}}

**Internal Data Summary:**
{{{internalHiringData}}}

**Task:**
1.  **Identify Hotspots:** Based on the roles, identify 4-5 key cities or regions in India that are well-known hubs for this type of talent (e.g., Bangalore for tech, Mumbai for finance).
2.  **Simulate Data:** For each hotspot, create a simulated talent count and list the most relevant top skills for the open roles.
3.  **Provide Strategy:** Write a single, high-level strategic recommendation based on your findings.

IMPORTANT: Your response MUST be in the JSON format specified by the output schema. Do not add any extra commentary before or after the JSON object.`,
});

const generateTalentMapFlow = ai.defineFlow(
  {
    name: 'generateTalentMapFlow',
    inputSchema: GenerateTalentMapInputSchema,
    outputSchema: GenerateTalentMapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
