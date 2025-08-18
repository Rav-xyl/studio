"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTalentMap = generateTalentMap;
/**
 * @fileOverview A Genkit flow for generating a global talent map.
 *
 * - generateTalentMap - A function that identifies talent hotspots based on simulated market data.
 * - GenerateTalentMapInput - The input type for the generateTalentMap function.
 * - GenerateTalentMapOutput - The return type for the generateTalentMap function.
 */
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
const GenerateTalentMapInputSchema = genkit_2.z.object({
    openRoles: genkit_2.z.array(genkit_2.z.object({
        title: genkit_2.z.string(),
        description: genkit_2.z.string(),
    })).describe('A list of currently open job roles.'),
    internalHiringData: genkit_2.z.string().describe("A summary of the company's internal hiring data and locations."),
});
const TalentHotspotSchema = genkit_2.z.object({
    location: genkit_2.z.string().describe("The city or region identified as a talent hotspot (e.g., 'Bangalore, India')."),
    talentCount: genkit_2.z.number().describe("A simulated number representing the relative size of the talent pool in this location."),
    topSkills: genkit_2.z.array(genkit_2.z.string()).describe("The top 3-5 skills prevalent in this location's talent pool."),
});
const GenerateTalentMapOutputSchema = genkit_2.z.object({
    hotspots: genkit_2.z.array(TalentHotspotSchema).describe("A list of identified talent hotspots."),
    strategicRecommendation: genkit_2.z.string().describe("A high-level strategic recommendation for the company's talent acquisition strategy based on the map."),
});
async function generateTalentMap(input) {
    return generateTalentMapFlow(input);
}
const prompt = genkit_1.ai.definePrompt({
    name: 'generateTalentMapPrompt',
    input: { schema: GenerateTalentMapInputSchema },
    output: { schema: GenerateTalentMapOutputSchema },
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
const generateTalentMapFlow = genkit_1.ai.defineFlow({
    name: 'generateTalentMapFlow',
    inputSchema: GenerateTalentMapInputSchema,
    outputSchema: GenerateTalentMapOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    return output;
});
