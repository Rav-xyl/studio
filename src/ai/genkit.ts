import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as dotenv from 'dotenv';
dotenv.config();

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Use a fast and reliable Google model as the default
  model: 'googleai/gemini-2.0-flash-preview',
});
