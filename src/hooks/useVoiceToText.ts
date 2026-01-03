'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseVoiceToTextReturn {
    isListening: boolean
    transcript: string
    interimTranscript: string
    isSupported: boolean
    startListening: () => Promise<void>
    stopListening: () => void
    resetTranscript: () => void
    error: string | null
    isModelLoading: boolean
}

export function useVoiceToText(): UseVoiceToTextReturn {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSupported, setIsSupported] = useState(false)

    // Recognition instance ref
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            setIsSupported(!!SpeechRecognition)
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop() } catch (e) { }
            }
        }
    }, [])

    const startListening = useCallback(async () => {
        setError(null)

        if (!isSupported) {
            setError('Speech Recognition is not supported in this browser.')
            return
        }

        if (isListening) return

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SpeechRecognition()

            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US' // Default to English, could be configurable

            recognition.onstart = () => {
                setIsListening(true)
            }

            recognition.onresult = (event: any) => {
                let final = ''
                let interim = ''

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript
                    } else {
                        interim += event.results[i][0].transcript
                    }
                }

                if (final) {
                    setTranscript(prev => prev + (prev ? ' ' : '') + final)
                }
                setInterimTranscript(interim)
            }

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error)
                let message = `Error: ${event.error}`

                switch (event.error) {
                    case 'network':
                        message = 'Connection error. Check internet.'
                        break
                    case 'not-allowed':
                    case 'service-not-allowed':
                        message = 'Microphone access denied.'
                        setIsListening(false)
                        break
                    case 'no-speech':
                        message = 'No speech detected.'
                        break
                    case 'audio-capture':
                        message = 'No microphone found.'
                        break
                }

                setError(message)
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    setIsListening(false)
                }
            }

            recognition.onend = () => {
                // If we didn't manually stop (and no error), we might want to restart?
                // For now, let's just update state. The logic often restarts automatically if continuous.
                // But typically onend fires when it stops.
                // We'll set listening to false unless implementation keeps it alive.
                setIsListening(false)
            }

            recognitionRef.current = recognition
            recognition.start()

        } catch (err: any) {
            console.error('Failed to start speech recognition:', err)
            setError(err.message || 'Failed to start microphone')
            setIsListening(false)
        }
    }, [isSupported, isListening])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop()
            } catch (e) {
                // ignore
            }
        }
        setIsListening(false)
        setInterimTranscript('')
    }, [])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
    }, [])

    return {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
        isModelLoading: false // Native API doesn't load a model
    }
}
