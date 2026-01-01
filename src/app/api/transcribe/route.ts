import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { transcribeAudio, isDeepgramAvailable } from '@/lib/deepgram'

export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if Deepgram is available
        if (!isDeepgramAvailable()) {
            return NextResponse.json(
                { error: 'Transcription service not configured', fallback: true },
                { status: 503 }
            )
        }

        // Get the audio data from the request
        const formData = await req.formData()
        const audioFile = formData.get('audio') as Blob | null

        if (!audioFile) {
            return NextResponse.json(
                { error: 'No audio file provided' },
                { status: 400 }
            )
        }

        // Convert Blob to Buffer
        const arrayBuffer = await audioFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Get MIME type
        const mimeType = audioFile.type || 'audio/webm'

        // Transcribe the audio
        const { transcript, confidence } = await transcribeAudio(buffer, mimeType)

        return NextResponse.json({
            transcript,
            confidence,
            source: 'deepgram'
        })
    } catch (error) {
        console.error('Transcription error:', error)

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Transcription failed',
                fallback: true
            },
            { status: 500 }
        )
    }
}

// Return service status
export async function GET() {
    return NextResponse.json({
        available: isDeepgramAvailable(),
        service: 'deepgram'
    })
}
