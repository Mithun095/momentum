'use client'

import { useState, useRef, useEffect } from 'react'

interface VoiceInputProps {
    onTranscript: (text: string) => void
    disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isTranscribing, setIsTranscribing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const startRecording = async () => {
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
                stream.getTracks().forEach(track => track.stop())
                await transcribeAudio(audioBlob)
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error('Failed to start recording:', err)
            setError('Microphone access denied')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const transcribeAudio = async (audioBlob: Blob) => {
        setIsTranscribing(true)
        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.webm')

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Transcription failed')
            }

            const data = await response.json()
            if (data.transcript) {
                onTranscript(data.transcript)
            }
        } catch (err) {
            console.error('Transcription error:', err)
            setError('Failed to transcribe audio')
        } finally {
            setIsTranscribing(false)
        }
    }

    const handleClick = () => {
        if (isRecording) {
            stopRecording()
        } else {
            startRecording()
        }
    }

    return (
        <div className="relative">
            <button
                onClick={handleClick}
                disabled={disabled || isTranscribing}
                className={`
                    p-2 rounded-lg transition-all
                    ${isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            >
                {isTranscribing ? (
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isRecording ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        )}
                    </svg>
                )}
            </button>

            {error && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300 text-xs rounded whitespace-nowrap">
                    {error}
                </div>
            )}
        </div>
    )
}
