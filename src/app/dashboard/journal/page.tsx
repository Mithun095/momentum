'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { JournalEntryCard } from '@/components/journal/JournalEntryCard'
import { api } from '@/lib/trpc/client'
import { Plus, Search, Calendar, ArrowLeft } from 'lucide-react'
import { format, subDays } from 'date-fns'

export default function JournalPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')

    // Use state to keep dates stable and prevent infinite refetching
    const [{ startDate, endDate }] = useState(() => {
        const end = new Date()
        const start = subDays(end, 90)
        return { startDate: start, endDate: end }
    })

    const { data: entries, isLoading } = api.journal.getAll.useQuery({
        startDate,
        endDate,
    })

    const handleNewEntry = () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        router.push(`/dashboard/journal/${today}`)
    }

    // Filter entries by search query
    const filteredEntries = entries?.filter((entry) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
            entry.mainContent.toLowerCase().includes(query) ||
            entry.sections?.some((s) => s.content.toLowerCase().includes(query))
        )
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Journal
                            </h1>
                        </div>
                        <Button
                            onClick={handleNewEntry}
                            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Entry
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search journal entries..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                        />
                    </div>
                </div>

                {/* Journal Entries List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-full mb-1" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !filteredEntries || filteredEntries.length === 0 ? (
                    <Card className="py-16">
                        <CardContent className="text-center">
                            <div className="text-6xl mb-4">📔</div>
                            <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                {searchQuery ? 'No entries found' : 'No journal entries yet'}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {searchQuery
                                    ? 'Try a different search term'
                                    : 'Start writing your first journal entry to capture your thoughts'
                                }
                            </p>
                            {!searchQuery && (
                                <Button
                                    onClick={handleNewEntry}
                                    className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Write Today's Entry
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredEntries.map((entry) => (
                            <JournalEntryCard key={entry.id} entry={entry} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
