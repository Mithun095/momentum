'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseVoiceToTextOptions {
    continuous?: boolean
    interimResults?: boolean
    lang?: string
}

interface UseVoiceToTextReturn {
    isListening: boolean
    transcript: string
    interimTranscript: string
    isSupported: boolean
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
    error: string | null
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}): UseVoiceToTextReturn {
    const {
        continuous = true,
        interimResults = true,
        lang = 'en-US'
    } = options

    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSupported, setIsSupported] = useState(false)

    const recognitionRef = useRef<SpeechRecognition | null>(null)

    // Check for browser support
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        setIsSupported(!!SpeechRecognition)

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = continuous
            recognitionRef.current.interimResults = interimResults
            recognitionRef.current.lang = lang

            recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
                let finalTranscript = ''
                let interim = ''

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i]
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript + ' '
                    } else {
                        interim += result[0].transcript
                    }
                }

                if (finalTranscript) {
                    setTranscript((prev) => prev + finalTranscript)
                }
                setInterimTranscript(interim)
            }

            recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
                console.error('Speech recognition error:', event.error)
                setError(event.error)
                setIsListening(false)
            }

            recognitionRef.current.onend = () => {
                setIsListening(false)
                setInterimTranscript('')
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort()
            }
        }
    }, [continuous, interimResults, lang])

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Speech recognition not supported')
            return
        }

        setError(null)
        setTranscript('')
        setInterimTranscript('')

        try {
            recognitionRef.current.start()
            setIsListening(true)
        } catch (err) {
            console.error('Failed to start speech recognition:', err)
            setError('Failed to start speech recognition')
        }
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [isListening])

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
        error
    }
}
