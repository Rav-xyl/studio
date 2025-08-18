import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Use the correct and latest available model name
  model: 'googleai/gemini-1.5-flash-latest',
});
