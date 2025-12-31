'use client'

import { Card, CardContent } from '@/components/ui/card'
import { getMoodInfo } from './MoodSelector'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface JournalEntry {
    id: string
    entryDate: Date | string
    mainContent: string
    mood?: string | null
    sections?: Array<{ sectionType: string; content: string }>
}

interface JournalEntryCardProps {
    entry: JournalEntry
    className?: string
}

export function JournalEntryCard({ entry, className }: JournalEntryCardProps) {
    const date = new Date(entry.entryDate)
    const moodInfo = entry.mood ? getMoodInfo(entry.mood) : null

    // Get preview of content (first 150 characters)
    const preview = entry.mainContent.length > 150
        ? entry.mainContent.substring(0, 150) + '...'
        : entry.mainContent

    const sectionCount = entry.sections?.filter(s => s.content.trim()).length || 0

    return (
        <Link href={`/dashboard/journal/${format(date, 'yyyy-MM-dd')}`}>
            <Card className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                "border-gray-200 dark:border-gray-700",
                className
            )}>
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                {format(date, 'EEEE, MMMM d')}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {format(date, 'yyyy')}
                            </p>
                        </div>
                        {moodInfo && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700">
                                <span className="text-lg">{moodInfo.emoji}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {moodInfo.label}
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                        {preview}
                    </p>

                    {sectionCount > 0 && (
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                {sectionCount} section{sectionCount > 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}
