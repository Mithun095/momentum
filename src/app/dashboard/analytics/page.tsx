'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/trpc/client'
import { MoodChart } from '@/components/analytics/MoodChart'
import { ProductivityHeatmap } from '@/components/analytics/ProductivityHeatmap'
import { WeeklyReport } from '@/components/analytics/WeeklyReport'
import { MonthlyTrend } from '@/components/analytics/MonthlyTrend'
import { ExportButton } from '@/components/analytics/ExportButton'

export default function AnalyticsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [exportLoading, setExportLoading] = useState(false)

    const { data: moodStats, isLoading: moodLoading } = api.analytics.getMoodStats.useQuery(
        { days: 30 },
        { enabled: !!session }
    )

    const { data: heatmapData, isLoading: heatmapLoading } = api.analytics.getProductivityHeatmap.useQuery(
        { months: 3 },
        { enabled: !!session }
    )

    const { data: weeklySummary, isLoading: weeklyLoading } = api.analytics.getWeeklySummary.useQuery(
        undefined,
        { enabled: !!session }
    )

    const { data: monthlySummary, isLoading: monthlyLoading } = api.analytics.getMonthlySummary.useQuery(
        undefined,
        { enabled: !!session }
    )

    const { data: overallStats, isLoading: overallLoading } = api.analytics.getOverallStats.useQuery(
        undefined,
        { enabled: !!session }
    )

    const exportMutation = api.analytics.exportData.useQuery

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    const handleExport = async (format: 'json' | 'csv', type: 'habits' | 'tasks' | 'journals' | 'all') => {
        setExportLoading(true)
        try {
            const response = await fetch(`/api/trpc/analytics.exportData?input=${encodeURIComponent(JSON.stringify({ format, type }))}`)
            const result = await response.json()

            if (result.result?.data) {
                const blob = new Blob([result.result.data.data], { type: result.result.data.contentType })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `momentum-export-${type}-${new Date().toISOString().split('T')[0]}.${format}`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setExportLoading(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    const isLoading = moodLoading || heatmapLoading || weeklyLoading || monthlyLoading || overallLoading

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                ← Back
                            </Link>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Analytics
                            </h1>
                        </div>
                        <ExportButton onExport={handleExport} isLoading={exportLoading} />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Overall Stats Banner */}
                        {overallStats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.totalHabits}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Active Habits</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{overallStats.totalCompletions}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Habit Completions</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.longestStreak}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Longest Streak</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.totalTasks}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Tasks</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{overallStats.taskCompletionRate}%</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Task Completion</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{overallStats.totalJournals}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Journal Entries</p>
                                </div>
                            </div>
                        )}

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* Mood Chart */}
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Mood Over Time
                                </h2>
                                <MoodChart data={moodStats || []} />
                            </div>

                            {/* Weekly Report */}
                            {weeklySummary && <WeeklyReport data={weeklySummary} />}
                        </div>

                        {/* Productivity Heatmap */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Activity Heatmap (Last 3 Months)
                            </h2>
                            <ProductivityHeatmap data={heatmapData || []} />
                        </div>

                        {/* Monthly Trend */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {monthlySummary && <MonthlyTrend data={monthlySummary} />}

                            {/* Tips Card */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    💡 Insights
                                </h3>
                                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                    {weeklySummary && weeklySummary.habitCompletionRate < 50 && (
                                        <li className="flex items-start gap-2">
                                            <span className="text-yellow-500">⚠️</span>
                                            <span>Your habit completion rate is below 50%. Try focusing on fewer habits to build consistency.</span>
                                        </li>
                                    )}
                                    {weeklySummary && weeklySummary.journalEntries < 3 && (
                                        <li className="flex items-start gap-2">
                                            <span className="text-blue-500">📝</span>
                                            <span>You've written {weeklySummary.journalEntries} journal entries this week. Aim for at least 3 for better self-reflection.</span>
                                        </li>
                                    )}
                                    {overallStats && overallStats.longestStreak >= 7 && (
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-500">🔥</span>
                                            <span>Great job! Your longest streak is {overallStats.longestStreak} days. Keep the momentum going!</span>
                                        </li>
                                    )}
                                    {monthlySummary && monthlySummary.trends.habits > 0 && (
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-500">📈</span>
                                            <span>You're {monthlySummary.trends.habits}% more consistent with habits compared to last month!</span>
                                        </li>
                                    )}
                                    {(!weeklySummary || weeklySummary.habitCompletionRate >= 50) &&
                                        (!weeklySummary || weeklySummary.journalEntries >= 3) &&
                                        (!overallStats || overallStats.longestStreak < 7) &&
                                        (!monthlySummary || monthlySummary.trends.habits <= 0) && (
                                            <li className="flex items-start gap-2">
                                                <span className="text-purple-500">✨</span>
                                                <span>Keep tracking your activities to unlock personalized insights!</span>
                                            </li>
                                        )}
                                </ul>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
