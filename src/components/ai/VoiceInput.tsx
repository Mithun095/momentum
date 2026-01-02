'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVoiceToText } from '@/hooks/useVoiceToText'

interface VoiceInputProps {
    onTranscript: (text: string) => void
    onPartialTranscript?: (text: string) => void
    isProcessing?: boolean
    disabled?: boolean
    className?: string
}

export function VoiceInput({
    onTranscript,
    onPartialTranscript,
    isProcessing = false,
    disabled = false,
    className
}: VoiceInputProps) {
    const {
        isListening,
        transcript,
        interimTranscript,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
        isModelLoading
    } = useVoiceToText()

    // Handle final results - pass only new segments
    useEffect(() => {
        if (transcript) {
            onTranscript(transcript)
            resetTranscript()
        }
    }, [transcript, onTranscript, resetTranscript])

    // Handle partial results - real-time feedback
    useEffect(() => {
        if (onPartialTranscript) {
            onPartialTranscript(interimTranscript)
        }
    }, [interimTranscript, onPartialTranscript])

    const toggleRecording = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    return (
        <div className={cn("relative flex items-center gap-2", className)}>
            <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                className={cn(
                    "rounded-full w-10 h-10 transition-all duration-300",
                    isListening && "animate-pulse scale-105 shadow-md shadow-red-500/20",
                    !isSupported && "opacity-50 cursor-not-allowed"
                )}
                onClick={toggleRecording}
                disabled={disabled || isProcessing || !isSupported || isModelLoading}
                title={!isSupported ? "Requires HTTPS" : isListening ? "Stop recording" : "Start voice"}
            >
                {isModelLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isListening ? (
                    <MicOff className="h-4 w-4" />
                ) : (
                    <Mic className="h-4 w-4" />
                )}
            </Button>

            {isListening && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap animate-in fade-in zoom-in duration-200 pointer-events-none">
                    Listening...
                </div>
            )}

            {error && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    {error}
                </div>
            )}
        </div>
    )
}
