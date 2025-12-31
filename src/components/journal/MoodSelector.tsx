'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const MOODS = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'sad', emoji: '😢', label: 'Sad' },
    { value: 'angry', emoji: '😤', label: 'Frustrated' },
    { value: 'tired', emoji: '😴', label: 'Tired' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'excited', emoji: '🤩', label: 'Excited' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
] as const

export type MoodValue = (typeof MOODS)[number]['value']

interface MoodSelectorProps {
    value?: string | null
    onChange: (mood: string) => void
    className?: string
}

export function MoodSelector({ value, onChange, className }: MoodSelectorProps) {
    return (
        <div className={cn("", className)}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How are you feeling?
            </label>
            <div className="flex flex-wrap gap-2">
                {MOODS.map((mood) => (
                    <button
                        key={mood.value}
                        onClick={() => onChange(mood.value)}
                        className={cn(
                            "flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all",
                            "text-sm",
                            value === mood.value
                                ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                        type="button"
                    >
                        <span className="text-lg">{mood.emoji}</span>
                        <span className="text-gray-700 dark:text-gray-300">{mood.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export function getMoodInfo(mood: string) {
    return MOODS.find((m) => m.value === mood) || { value: mood, emoji: '😐', label: 'Unknown' }
}
