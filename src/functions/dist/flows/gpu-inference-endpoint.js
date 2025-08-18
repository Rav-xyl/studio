"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpuInferenceFlow = void 0;
const genkit_1 = require("genkit");
const genkit_2 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
(0, genkit_1.configureGenkit)({
    plugins: [
        (0, googleai_1.googleAI)(),
    ],
    logLevel: 'debug',
    flowStateStore: 'firebase',
});
exports.gpuInferenceFlow = (0, genkit_1.defineFlow)({
    name: 'gpuInferenceFlow',
    inputSchema: genkit_2.z.string(),
    outputSchema: genkit_2.z.string(),
}, async (input) => {
    // In a real scenario, you would use a model that runs on a GPU here.
    // For this example, we'll just return a simple message.
    console.log('Running inference on GPU-backed instance with input:', input);
    return `Response from GPU-backed endpoint for input: ${input}`;
});
