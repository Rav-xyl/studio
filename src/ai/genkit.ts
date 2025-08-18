import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import * as dotenv from 'dotenv';
dotenv.config();

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
  // Use the correct and latest available model name
  model: 'openai/gpt-3.5-turbo',
});
