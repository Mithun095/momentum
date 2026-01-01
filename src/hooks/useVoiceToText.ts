'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

interface UseVoiceToTextOptions {
    continuous?: boolean
    interimResults?: boolean
    lang?: string
    useDeepgram?: boolean // Use Deepgram API instead of Web Speech API
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
    isProcessing: boolean
    source: 'web-speech' | 'deepgram' | null
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}): UseVoiceToTextReturn {
    const {
        continuous = true,
        interimResults = true,
        lang = 'en-US',
        useDeepgram = true // Default to trying Deepgram first
    } = options

    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSupported, setIsSupported] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [source, setSource] = useState<'web-speech' | 'deepgram' | null>(null)
    const [deepgramAvailable, setDeepgramAvailable] = useState<boolean | null>(null)

    const recognitionRef = useRef<SpeechRecognition | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    // Check Deepgram availability on mount
    useEffect(() => {
        if (useDeepgram) {
            fetch('/api/transcribe')
                .then(res => res.json())
                .then(data => setDeepgramAvailable(data.available))
                .catch(() => setDeepgramAvailable(false))
        }
    }, [useDeepgram])

    // Check for browser support (Web Speech API)
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const hasWebSpeech = !!SpeechRecognition
        const hasMediaRecorder = typeof MediaRecorder !== 'undefined'

        setIsSupported(hasWebSpeech || (useDeepgram && hasMediaRecorder))

        if (hasWebSpeech) {
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
                    setSource('web-speech')
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
    }, [continuous, interimResults, lang, useDeepgram])

    // Deepgram recording functions
    const startDeepgramRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            })

            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop())

                if (audioChunksRef.current.length > 0) {
                    setIsProcessing(true)
                    setInterimTranscript('Processing audio...')

                    try {
                        const audioBlob = new Blob(audioChunksRef.current, {
                            type: mediaRecorder.mimeType
                        })

                        const formData = new FormData()
                        formData.append('audio', audioBlob)

                        const response = await fetch('/api/transcribe', {
                            method: 'POST',
                            body: formData
                        })

                        const data = await response.json()

                        if (response.ok && data.transcript) {
                            setTranscript(prev => prev + (prev ? ' ' : '') + data.transcript)
                            setSource('deepgram')
                        } else if (data.fallback) {
                            // Deepgram failed, user should try Web Speech API
                            setError('Transcription service unavailable. Try again.')
                        } else {
                            setError(data.error || 'Transcription failed')
                        }
                    } catch (err) {
                        console.error('Deepgram transcription error:', err)
                        setError('Failed to transcribe audio')
                    } finally {
                        setIsProcessing(false)
                        setInterimTranscript('')
                    }
                }
            }

            mediaRecorder.start(1000) // Collect data every second
            setIsListening(true)
            setError(null)
        } catch (err) {
            console.error('Failed to start recording:', err)
            setError('Microphone access denied')
        }
    }, [])

    const stopDeepgramRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
            setIsListening(false)
        }
    }, [])

    const startListening = useCallback(() => {
        setError(null)
        setTranscript('')
        setInterimTranscript('')
        setSource(null)

        // Decide which method to use
        const shouldUseDeepgram = useDeepgram && deepgramAvailable

        if (shouldUseDeepgram) {
            startDeepgramRecording()
        } else if (recognitionRef.current) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (err) {
                console.error('Failed to start speech recognition:', err)
                setError('Failed to start speech recognition')
            }
        } else {
            setError('Speech recognition not supported')
        }
    }, [useDeepgram, deepgramAvailable, startDeepgramRecording])

    const stopListening = useCallback(() => {
        // Stop Deepgram recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            stopDeepgramRecording()
            return
        }

        // Stop Web Speech API
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }
    }, [isListening, stopDeepgramRecording])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
        setSource(null)
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
        isProcessing,
        source
    }
}
