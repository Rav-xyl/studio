
import mammoth from 'mammoth';

/**
 * Extracts raw text from a DOCX file provided as a data URI.
 * @param dataUri The data URI of the DOCX file.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromDocx(dataUri: string): Promise<string> {
    if (!dataUri.startsWith('data:')) {
        throw new Error('Invalid data URI provided.');
    }

    const base64Data = dataUri.split(',')[1];
    if (!base64Data) {
        throw new Error('Could not find base64 data in the data URI.');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
}
