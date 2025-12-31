'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { JournalEditor } from '@/components/journal/JournalEditor'
import { MoodSelector } from '@/components/journal/MoodSelector'
import { JournalSections } from '@/components/journal/JournalSections'
import { MediaAttachments } from '@/components/journal/MediaAttachments'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { format, parse } from 'date-fns'
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react'

interface Section {
    type: 'mistakes' | 'good_things' | 'planner'
    content: string
}

interface Attachment {
    id?: string
    fileName: string
    fileType: string
    filePath: string
    fileSize: number
}

export default function JournalEntryPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const dateStr = params.date as string

    // Parse date from URL with validation
    const entryDate = parse(dateStr, 'yyyy-MM-dd', new Date())
    const isValidDate = !isNaN(entryDate.getTime()) && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)

    const [mainContent, setMainContent] = useState('')
    const [mood, setMood] = useState<string | null>(null)
    const [sections, setSections] = useState<Section[]>([])
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [isCreating, setIsCreating] = useState(false)

    // Fetch existing entry for this date
    const { data: existingEntry, isLoading } = api.journal.getByDate.useQuery(
        { date: entryDate },
        { enabled: !!dateStr && !!isValidDate }
    )

    const utils = api.useUtils()

    // Create mutation
    const createEntry = api.journal.create.useMutation({
        onSuccess: () => {
            toast({
                title: 'Entry saved!',
                description: 'Your journal entry has been saved.',
            })
            void utils.journal.getAll.invalidate()
            void utils.journal.getByDate.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to save entry',
                variant: 'destructive',
            })
        },
    })

    // Update mutation
    const updateEntry = api.journal.update.useMutation({
        onSuccess: () => {
            toast({
                title: 'Entry updated!',
                description: 'Your changes have been saved.',
            })
            void utils.journal.getAll.invalidate()
            void utils.journal.getByDate.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update entry',
                variant: 'destructive',
            })
        },
    })

    // Load existing entry data
    useEffect(() => {
        if (existingEntry) {
            setMainContent(existingEntry.mainContent)
            setMood(existingEntry.mood)
            if (existingEntry.sections) {
                setSections(
                    existingEntry.sections.map((s) => ({
                        type: s.sectionType as Section['type'],
                        content: s.content,
                    }))
                )
            }
            if (existingEntry.attachments) {
                setAttachments(
                    existingEntry.attachments.map((a) => ({
                        id: a.id,
                        fileName: a.fileName,
                        fileType: a.fileType,
                        filePath: a.filePath,
                        fileSize: a.fileSize,
                    }))
                )
            }
        }
    }, [existingEntry])

    const handleSave = useCallback(async (content: string) => {
        setMainContent(content)

        if (existingEntry) {
            // Update existing
            await updateEntry.mutateAsync({
                id: existingEntry.id,
                mainContent: content,
                mood: mood || undefined,
            })
        } else {
            // Create new
            setIsCreating(true)
            await createEntry.mutateAsync({
                entryDate,
                mainContent: content,
                mood: mood || undefined,
                sections: sections.filter((s) => s.content.trim()).map((s) => ({
                    sectionType: s.type,
                    content: s.content,
                })),
            })
            setIsCreating(false)
        }
    }, [existingEntry, mood, sections, entryDate, createEntry, updateEntry])

    const handleMoodChange = (newMood: string) => {
        setMood(newMood)
        // Auto-save mood if entry exists
        if (existingEntry) {
            updateEntry.mutate({
                id: existingEntry.id,
                mood: newMood,
            })
        }
    }

    // Invalid date check
    if (!isValidDate) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Invalid Date
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        The date format in the URL is invalid. Please use YYYY-MM-DD format.
                    </p>
                    <Button onClick={() => router.push('/dashboard/journal')}>
                        Back to Journal
                    </Button>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="max-w-3xl mx-auto">
                    <Skeleton className="h-8 w-64 mb-8" />
                    <Skeleton className="h-[400px] w-full mb-4" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/dashboard/journal')}
                                className="text-gray-600 dark:text-gray-400"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                                {format(entryDate, 'EEEE, MMMM d, yyyy')}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-6">
                    {/* Mood Selector */}
                    <Card>
                        <CardContent className="p-4">
                            <MoodSelector value={mood} onChange={handleMoodChange} />
                        </CardContent>
                    </Card>

                    {/* Main Editor */}
                    <JournalEditor
                        initialContent={mainContent}
                        onSave={handleSave}
                        placeholder="How was your day? What's on your mind?"
                    />

                    {/* Media Attachments */}
                    <MediaAttachments
                        attachments={attachments}
                        onChange={setAttachments}
                        entryId={existingEntry?.id}
                    />

                    {/* Optional Sections */}
                    <JournalSections sections={sections} onChange={setSections} />

                    {/* Save Button for new entries with sections */}
                    {!existingEntry && (
                        <Button
                            onClick={() => handleSave(mainContent)}
                            disabled={!mainContent.trim() || isCreating}
                            className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Entry'
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
