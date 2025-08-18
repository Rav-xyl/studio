"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpuInferenceEndpoint = void 0;
const params_1 = require("firebase-functions/params");
const genkit_1 = require("firebase-functions/v2/genkit");
const gpu_inference_endpoint_1 = require("./flows/gpu-inference-endpoint");
// Define the environment variable for the Google Cloud region.
const region = (0, params_1.defineString)('REGION', {
    description: 'The Google Cloud region to deploy the function to.',
    // Default to a region with GPU availability.
    default: 'us-central1',
});
// Define the service account for the function.
const serviceAccount = (0, params_1.defineString)('SERVICE_ACCOUNT', {
    description: 'The service account for the function.',
    // This should be the service account that your Firebase app uses.
    default: 'firebase-adminsdk@talentflow-ai-1lu7m.iam.gserviceaccount.com',
});
// Expose the Genkit flow as an HTTPS endpoint.
exports.gpuInferenceEndpoint = (0, genkit_1.onFlow)({
    name: 'gpuInferenceEndpoint',
    region: region,
    // This will deploy the function to a VM with an NVIDIA T4 GPU.
    // In a real scenario, you would need to have the appropriate quota
    // and billing enabled for this to work.
    // For this example, we'll just specify the GPU.
    // You can find more information about available GPUs here:
    // https://cloud.google.com/compute/docs/gpus
    // and how to configure them for Cloud Functions here:
    // https://cloud.google.com/functions/docs/configuring/gpu
    //
    // Note: This is a premium feature.
    gpu: 'T4',
    // Assign the correct service account to the function.
    serviceAccount: serviceAccount,
    // Optimize for speed over cost.
    minInstances: 1,
    maxInstances: 10,
    // Use a fast model runtime.
    runtime: 'nodejs18',
}, gpu_inference_endpoint_1.gpuInferenceFlow);
