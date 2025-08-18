"use strict";
'use server';
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpuInferenceFlow = void 0;
const genkit_1 = require("@/ai/genkit");
const genkit_2 = require("genkit");
exports.gpuInferenceFlow = genkit_1.ai.flow({
    name: 'gpuInferenceFlow',
    inputSchema: genkit_2.z.string(),
    outputSchema: genkit_2.z.string(),
}, async (input) => {
    // In a real scenario, you would use a model that runs on a GPU here.
    // For this example, we'll just return a simple message.
    console.log('Running inference on GPU-backed instance with input:', input);
    return `Response from GPU-backed endpoint for input: ${input}`;
});
