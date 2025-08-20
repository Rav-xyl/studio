'use server';
/**
 * @fileOverview A Genkit flow for detecting faces in an image.
 *
 * - detectFaces - A function that analyzes an image and detects human faces.
 * - DetectFacesInput - The input type for the function.
 * - DetectFacesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const DetectFacesInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "An image frame from a video, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:image/jpeg;base64,<encoded_data>'."
    ),
});
export type DetectFacesInput = z.infer<typeof DetectFacesInputSchema>;

const FaceDetectionSchema = z.object({
    box: z.array(z.number()).describe("The bounding box of the detected face [x1, y1, x2, y2]."),
    confidence: z.number().describe("The confidence score for the face detection."),
});

const DetectFacesOutputSchema = z.object({
  detections: z.array(FaceDetectionSchema).describe("A list of all faces detected in the image."),
  faceCount: z.number().describe("The total number of faces detected."),
});
export type DetectFacesOutput = z.infer<typeof DetectFacesOutputSchema>;


export async function detectFaces(input: DetectFacesInput): Promise<DetectFacesOutput> {
  return detectFacesFlow(input);
}

const detectFacesFlow = ai.defineFlow(
  {
    name: 'detectFacesFlow',
    inputSchema: DetectFacesInputSchema,
    outputSchema: DetectFacesOutputSchema,
  },
  async (input) => {
    // This flow uses a model with specific face detection capabilities.
    const faceDetectionModel = googleAI.model('gemini-1.5-flash-latest');
    
    const result = await ai.generate({
      model: faceDetectionModel,
      prompt: [
        {
          media: {
            url: input.imageDataUri,
          },
        },
        {
          text: `You are a face detection model. Analyze this image and identify all human faces. For each face, provide the bounding box and a confidence score. Your output must be in the specified JSON format. If no faces are found, return an empty detections array and a faceCount of 0.`,
        },
      ],
      output: {
        schema: DetectFacesOutputSchema,
      },
       config: {
        temperature: 0.1, // Low temperature for deterministic detection
      },
    });

    return result.output!;
  }
);
