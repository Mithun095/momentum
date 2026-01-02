'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
// Singleton model reference to prevent reloading
let globalModel: any = null
let modelLoadingPromise: Promise<any> | null = null

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
    const [isModelLoading, setIsModelLoading] = useState(false)
    const [isSupported, setIsSupported] = useState(false)

    const recognizerRef = useRef<any>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            setIsSupported(isSecure)
        }

        // Cleanup on unmount
        return () => {
            stopListening()
        }
    }, [])

    const loadModel = async () => {
        if (globalModel) return globalModel
        if (modelLoadingPromise) return modelLoadingPromise

        setIsModelLoading(true)
        modelLoadingPromise = (async () => {
            try {
                // @ts-ignore
                const Vosk = await import('vosk-browser')
                const model = await Vosk.createModel('/models/model.zip')
                model.setLogLevel(-1)
                globalModel = model
                return model
            } catch (err) {
                console.error('Failed to load Vosk model:', err)
                setError('Failed to load voice model')
                throw err
            } finally {
                setIsModelLoading(false)
            }
        })()

        return modelLoadingPromise
    }

    const startListening = useCallback(async () => {
        setError(null)

        if (!isSupported) {
            setError('Voice requires HTTPS or localhost')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    channelCount: 1,
                    sampleRate: 16000
                }
            })

            streamRef.current = stream

            const model = await loadModel()
            const recognizer = new model.KaldiRecognizer(16000)

            recognizer.on('result', (message: any) => {
                const text = message.result?.text
                if (text && text.trim()) {
                    setTranscript(prev => prev + (prev ? ' ' : '') + text)
                    setInterimTranscript('')
                }
            })

            recognizer.on('partialresult', (message: any) => {
                const partial = message.result?.partial
                if (partial) {
                    setInterimTranscript(partial)
                }
            })

            recognizerRef.current = recognizer

            const audioContext = new AudioContext({ sampleRate: 16000 })
            const source = audioContext.createMediaStreamSource(stream)
            const processor = audioContext.createScriptProcessor(4096, 1, 1)

            processor.onaudioprocess = (event) => {
                if (recognizerRef.current && isListening) {
                    try {
                        const inputData = event.inputBuffer.getChannelData(0)
                        recognizerRef.current.acceptWaveform(inputData)
                    } catch (e) {
                        // ignore
                    }
                }
            }

            source.connect(processor)
            processor.connect(audioContext.destination)

            audioContextRef.current = audioContext
            sourceRef.current = source
            processorRef.current = processor

            setIsListening(true)
        } catch (err) {
            console.error('Error starting recording:', err)
            setError(err instanceof Error ? err.message : 'Could not access microphone')
            stopListening()
        }
    }, [isSupported, isListening]) // Added isListening to deps to allow proper state access inside audio process if needed, though ref is better

    const stopListening = useCallback(() => {
        setIsListening(false)

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        if (processorRef.current) {
            try { processorRef.current.disconnect() } catch (e) { }
            processorRef.current = null
        }

        if (sourceRef.current) {
            try { sourceRef.current.disconnect() } catch (e) { }
            sourceRef.current = null
        }

        if (audioContextRef.current) {
            try { audioContextRef.current.close() } catch (e) { }
            audioContextRef.current = null
        }

        if (recognizerRef.current) {
            try { recognizerRef.current.free() } catch (e) { }
            recognizerRef.current = null
        }
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
        isModelLoading
    }
}
