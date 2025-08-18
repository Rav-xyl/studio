'use server';

import { configureGenkit, defineFlow } from 'genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

configureGenkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  flowStateStore: 'firebase',
});

export const gpuInferenceFlow = defineFlow(
  {
    name: 'gpuInferenceFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (input: string) => {
    // In a real scenario, you would use a model that runs on a GPU here.
    // For this example, we'll just return a simple message.
    console.log('Running inference on GPU-backed instance with input:', input);
    return `Response from GPU-backed endpoint for input: ${input}`;
  }
);
