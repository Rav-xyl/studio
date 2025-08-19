
'use server';
/**
 * @fileOverview The "Astra" AI assistant flow for providing in-app help and performing actions.
 *
 * This flow is designed to answer questions about the TalentFlow application and use tools
 * to perform actions on behalf of the user, such as deleting a candidate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { googleAI } from '@genkit-ai/googleai';

// Tool to delete a candidate by name
const deleteCandidateByName = ai.defineTool(
  {
    name: 'deleteCandidateByName',
    description: 'Deletes a candidate record from the database based on their full name. Use this tool when the user explicitly asks to delete a specific person.',
    inputSchema: z.object({
      fullName: z.string().describe("The full name of the candidate to delete."),
    }),
    outputSchema: z.string(),
  },
  async ({ fullName }) => {
    try {
      const q = query(collection(db, 'candidates'), where('name', '==', fullName));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return `Candidate "${fullName}" not found.`;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      return `Successfully deleted candidate: ${fullName}.`;
    } catch (error) {
      console.error("Tool execution failed:", error);
      return `An error occurred while trying to delete ${fullName}. Please check the system logs.`;
    }
  }
);

// Tool for formatting the final response to the user.
const formatFinalResponse = ai.defineTool(
  {
      name: 'formatFinalResponse',
      description: 'Use this tool to format your final answer to the user. You MUST use this tool to provide the final output to the user.',
      inputSchema: z.object({
          response: z.string().describe('The final, plain-text response to be presented to the user.'),
      }),
      outputSchema: z.string(),
  },
  async ({ response }) => {
      // This tool simply returns the formatted string, ensuring it's the final output.
      return response;
  }
);


const AskAstraInputSchema = z.object({
  question: z.string().describe('The user\'s question about the TalentFlow app.'),
  userContext: z.object({
    role: z.string().optional().describe("The role of the user asking the question, e.g., 'admin'."),
  }).optional(),
});
export type AskAstraInput = z.infer<typeof AskAstraInputSchema>;

const AskAstraOutputSchema = z.string().describe("Astra's response to the user's question.");
export type AskAstraOutput = z.infer<typeof AskAstraOutputSchema>;

export async function askAstra(input: AskAstraInput): Promise<AskAstraOutput> {
  return askAstraFlow(input);
}

const astraPrompt = ai.definePrompt({
  name: 'askAstraPrompt',
  input: { schema: AskAstraInputSchema },
  output: { format: 'text' },
  tools: [deleteCandidateByName, formatFinalResponse],
  system: `You are Astra, a helpful AI assistant for the TalentFlow application. Your purpose is to assist users by answering questions and performing actions related to the app.

**PRIMARY DIRECTIVE: Your knowledge is STRICTLY limited to the information in the TALENTFLOW KNOWLEDGE BASE. You must not discuss yourself or any topic outside of TalentFlow. If a user asks about "the system you made" or "how you work," interpret that as a question about the TalentFlow app.**

**RESPONSE AND TOOLING RULES:**
1.  **Tone:** Be helpful, concise, and professional.
2.  **NO MARKDOWN:** All responses MUST be in plain text. Do not use asterisks for bolding (**), hashes for headers (#), or any other markdown syntax.
3.  **MANDATORY FINAL STEP:** You MUST use the 'formatFinalResponse' tool to provide your final answer to the user for ALL queries.
4.  **Tool Workflow:**
    - If the user asks for an action (like deleting a user), first use the appropriate action tool (e.g., 'deleteCandidateByName').
    - Then, take the result from that tool (e.g., "Successfully deleted candidate: John Doe.") and use the 'formatFinalResponse' tool to deliver that confirmation to the user.
    - If the user asks a question, formulate your answer based on your knowledge base and then use the 'formatFinalResponse' tool to deliver it.
5.  **Admin Context:** If the user is an 'admin', be more direct. For regular users, be more guiding.
6.  **Polite Refusal:** If you cannot answer a question or fulfill a request, explain why politely using the 'formatFinalResponse' tool.

**--- TALENTFLOW KNOWLEDGE BASE ---**
This is your complete set of knowledge. Do not invent features.

- **Client Roles Tab:** Manage job roles. Users can add new roles by pasting a job description. The AI formats it and suggests titles. Role cards have AI actions to find matches (Top Matches, All Qualified), re-engage archived candidates, or view assigned candidates.
- **Candidate Pool Tab:** A Kanban board (Sourcing, Screening, Interview, Hired) for the hiring pipeline. Users can bulk upload resumes. The "Stimulate Pipeline" button runs an AI simulation of the hiring process.
- **Prospecting Hub:** A table of all unassigned candidates. Users can run an AI match for all candidates against all roles to populate match data across the system.
- **Gauntlet Portal Tab:** Manage candidates eligible for the AI-proctored technical interview (score >= 70). Recruiters copy credentials (ID and universal password 'TEST1234') from here to send to candidates.
- **Analytics Tab:** Dashboard with charts for hiring velocity, role distribution, and predictive forecasts.
- **Admin Command Center:**
  - **URL:** /admin/login
  - **Credentials:** Username 'admin', Password 'admin1234'.
  - **Features:** Monitor interviews, manage the master candidate database (including permanent deletion), and act on proactive AI sourcing alerts.
**--- END OF KNOWLEDGE BASE ---**
`,
});

const askAstraFlow = ai.defineFlow(
  {
    name: 'askAstraFlow',
    inputSchema: AskAstraInputSchema,
    outputSchema: AskAstraOutputSchema,
  },
  async ({ question, userContext }) => {
    let systemPrompt = astraPrompt.system;
    if(userContext?.role === 'admin') {
      systemPrompt += "\n**User Context:** You are speaking with an Administrator. You have access to all tools and can perform destructive actions if requested."
    }

    const llmResponse = await ai.generate({
      prompt: question,
      model: googleAI.model('gemini-2.5-flash'), // Upgraded model
      tools: astraPrompt.tools,
      toolChoice: "any", // Allow the model to choose tools
      config: {
        ...astraPrompt.config,
        system: systemPrompt,
      },
    });

    // We now EXPECT a tool request as the final output.
    // The model should call formatFinalResponse.
    const finalToolResponse = llmResponse.toolRequest?.output() as string | undefined;

    if (finalToolResponse) {
        return finalToolResponse;
    }

    // If for some reason the model fails to use the tool, we fall back to its text response,
    // but this should be the exception.
    if (llmResponse.text) {
        console.warn("Astra Warning: The model did not use the mandatory formatFinalResponse tool. Falling back to text response.");
        return llmResponse.text;
    }
    
    return "I apologize, but I was unable to process your request. Please try rephrasing your question.";
  }
);
