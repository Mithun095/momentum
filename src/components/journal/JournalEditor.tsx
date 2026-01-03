'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface JournalEditorProps {
    initialContent?: string
    onSave: (content: string) => Promise<void>
    placeholder?: string
    className?: string
}

export function JournalEditor({
    initialContent = '',
    onSave,
    placeholder = 'Write your thoughts for today...',
    className
}: JournalEditorProps) {
    const [content, setContent] = useState(initialContent)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)



    // Update content when initialContent changes (e.g., loading existing entry)
    useEffect(() => {
        setContent(initialContent)
    }, [initialContent])

    const handleSave = useCallback(async () => {
        if (!content.trim()) return

        setIsSaving(true)
        try {
            await onSave(content)
            setLastSaved(new Date())
        } finally {
            setIsSaving(false)
        }
    }, [content, onSave])



    const charCount = content.length
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

    return (
        <Card className={cn("", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                        Today's Entry
                    </CardTitle>
                    <div className="flex items-center gap-2">

                        {lastSaved && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !content.trim()}
                            size="sm"
                            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            <span className="ml-2">Save</span>
                        </Button>
                    </div>
                </div>

            </CardHeader>
            <CardContent>
                <div className="relative">
                    <textarea
                        value={content + (interimTranscript ? ' ' + interimTranscript : '')}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={placeholder}
                        className="w-full min-h-[300px] p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 resize-y"
                    />

                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{wordCount} words</span>
                    <span>{charCount} characters</span>
                </div>
            </CardContent>
        </Card>
    )
}
