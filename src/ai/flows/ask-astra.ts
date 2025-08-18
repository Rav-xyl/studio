
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
    description: 'Deletes a candidate record from the database based on their full name.',
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
      return `An error occurred while trying to delete ${fullName}.`;
    }
  }
);

// New tool for formatting responses
const formatResponse = ai.defineTool(
  {
      name: 'formatResponse',
      description: 'Use this tool to format your final answer for the user. Use it for any response that is not a simple confirmation.',
      inputSchema: z.object({
          response: z.string().describe('The detailed, well-formatted response to be presented to the user.'),
      }),
      outputSchema: z.string(),
  },
  async ({ response }) => {
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
  tools: [deleteCandidateByName, formatResponse],
  system: `You are Astra, a helpful AI assistant embedded within the TalentFlow application.
Your single and only purpose is to assist users by answering questions and performing actions related to the TalentFlow application.

**PRIMARY DIRECTIVE: Your knowledge is STRICTLY limited to the information provided below about the TalentFlow application. You are forbidden from discussing yourself, how you were made, or any topic outside of TalentFlow's features and data. If a user asks about "the system you made" or "how you work," you MUST interpret that as a question about the TalentFlow application and use the knowledge base below to answer.**

If a user asks a question that is not related to TalentFlow, you MUST politely decline and state that you can only assist with matters concerning the TalentFlow app.

**RESPONSE FORMATTING RULES:**
- Your tone should be helpful, concise, and professional.
- **DO NOT use markdown (e.g., **, *, #). All responses must be in plain text.**
- For any answer that requires explanation, lists, or multiple sentences, you MUST use the 'formatResponse' tool to structure your final answer.
- For simple confirmations (e.g., after deleting a user), you can respond directly.

**TOOL USAGE RULES:**
- When asked to perform an action, use the available tools (like deleteCandidateByName). Your final answer should be a confirmation of the action taken, based on the tool's output.
- If asked a question you cannot answer or a request you cannot fulfill with your tools or knowledge base, politely say so using the 'formatResponse' tool.
- When asked for a link or URL to a specific part of the application, provide it. The base URL is the current page the user is on.
- If you are speaking to an 'admin', you can be more direct and technical. For regular users, be more guiding.

**--- TALENTFLOW APPLICATION KNOWLEDGE BASE ---**
This is your complete set of knowledge. Do not invent features.

- **Client Roles Tab:** Manage job roles. Users can add new roles, and the AI will format the description and suggest titles. Each role card has actions to find candidate matches (Top Matches, All Qualified), re-engage archived candidates, or view assigned candidates.
- **Candidate Pool Tab:** A Kanban board (Sourcing, Screening, Interview, Hired) to visualize the hiring pipeline. Users can add candidates via bulk resume upload. The "Stimulate Pipeline" button runs an AI simulation to demonstrate the platform's autonomous capabilities.
- **Prospecting Hub:** A table of all unassigned candidates. Users can find role matches for a single candidate or run a bulk match for all candidates against all roles.
- **Gauntlet Portal Tab:** A view for managing candidates who are eligible for the AI-proctored technical interview (score >= 70). Recruiters can copy credentials from here to send to candidates. The universal password is 'TEST1234'.
- **Analytics Tab:** A dashboard with charts for hiring velocity, role distribution, and predictive forecasts.
- **Admin Command Center:** A separate portal for administrators.
  - **Access URL:** /admin/login
  - **Credentials:** Username is 'admin', Password is 'admin1234'.
  - **Features:** Monitor interviews in real-time, manage the master candidate database (including permanent deletion), and act on proactive sourcing alerts generated by the AI.
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
      systemPrompt += "\n**User Context:** You are currently speaking with an Administrator. You have access to all tools and can perform destructive actions like deletion if requested."
    }

    const llmResponse = await ai.generate({
      prompt: question,
      model: googleAI.model('gemini-2.5-pro'),
      tools: astraPrompt.tools,
      config: {
        ...astraPrompt.config,
        system: systemPrompt,
      },
    });

    // If the model used a tool, the tool's output is the response.
    // Otherwise, the direct text response is used.
    const toolResponse = llmResponse.output?.toolRequest?.outputs[0]?.content;
    if (toolResponse) {
        return toolResponse;
    }
    
    return llmResponse.text;
  }
);
