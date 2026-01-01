import { createClient } from '@deepgram/sdk'

// Initialize the Deepgram client
const deepgramApiKey = process.env.DEEPGRAM_API_KEY

if (!deepgramApiKey) {
    console.warn('DEEPGRAM_API_KEY is not set. Voice transcription will fall back to Web Speech API.')
}

export const deepgram = deepgramApiKey ? createClient(deepgramApiKey) : null

/**
 * Transcribe audio buffer using Deepgram
 * @param audioBuffer - The audio data as a Buffer
 * @param mimeType - The MIME type of the audio (e.g., 'audio/webm', 'audio/wav')
 * @returns The transcribed text
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string = 'audio/webm'
): Promise<{ transcript: string; confidence: number }> {
    if (!deepgram) {
        throw new Error('Deepgram is not configured. Set DEEPGRAM_API_KEY in your environment.')
    }

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
            model: 'nova-2',
            language: 'en',
            smart_format: true,
            punctuate: true,
        }
    )

    if (error) {
        throw new Error(`Deepgram transcription failed: ${error.message}`)
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ''
    const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    return { transcript, confidence }
}

/**
 * Check if Deepgram is available
 */
export function isDeepgramAvailable(): boolean {
    return !!deepgram
}
