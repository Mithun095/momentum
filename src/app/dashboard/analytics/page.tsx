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
import { CategoryRadarChart } from '@/components/analytics/CategoryRadarChart'
import { HabitDistributionChart } from '@/components/analytics/HabitDistributionChart'
import { GrowthAreaChart } from '@/components/analytics/GrowthAreaChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [exportLoading, setExportLoading] = useState(false)

    // Data fetching
    const { data: moodStats, isLoading: moodLoading } = api.analytics.getMoodStats.useQuery({ days: 30 }, { enabled: !!session })
    const { data: heatmapData, isLoading: heatmapLoading } = api.analytics.getProductivityHeatmap.useQuery({ months: 3 }, { enabled: !!session })
    const { data: weeklySummary, isLoading: weeklyLoading } = api.analytics.getWeeklySummary.useQuery(undefined, { enabled: !!session })
    const { data: monthlySummary, isLoading: monthlyLoading } = api.analytics.getMonthlySummary.useQuery(undefined, { enabled: !!session })
    const { data: overallStats, isLoading: overallLoading } = api.analytics.getOverallStats.useQuery(undefined, { enabled: !!session })
    const { data: categoryStats, isLoading: categoryLoading } = api.analytics.getHabitCategoryStats.useQuery(undefined, { enabled: !!session })
    const { data: habitDistribution, isLoading: distributionLoading } = api.analytics.getHabitDistribution.useQuery(undefined, { enabled: !!session })
    const { data: completionHistory, isLoading: historyLoading } = api.analytics.getCompletionHistory.useQuery({ days: 30 }, { enabled: !!session })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    const handleExport = async (format: 'json' | 'csv', type: 'habits' | 'tasks' | 'journals' | 'all') => {
        setExportLoading(true)
        try {
            const result = await (await fetch(`/api/trpc/analytics.exportData?input=${encodeURIComponent(JSON.stringify({ format, type }))}`)).json()
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
            </div>
        )
    }

    if (!session) return null

    const isLoading = moodLoading || heatmapLoading || weeklyLoading || monthlyLoading || overallLoading || categoryLoading || distributionLoading || historyLoading

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                                ← Dashboard
                            </Link>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                                Analytics Center
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
                        {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} className="h-80 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Overall Stats Row */}
                        {overallStats && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                                <StatsCard label="Active Habits" value={overallStats.totalHabits} />
                                <StatsCard label="Completions" value={overallStats.totalCompletions} color="text-emerald-600 dark:text-emerald-400" />
                                <StatsCard label="Longest Streak" value={overallStats.longestStreak} />
                                <StatsCard label="Total Tasks" value={overallStats.totalTasks} />
                                <StatsCard label="Task Rate" value={`${overallStats.taskCompletionRate}%`} color="text-blue-600 dark:text-blue-400" />
                                <StatsCard label="Journal Entries" value={overallStats.totalJournals} color="text-purple-600 dark:text-purple-400" />
                            </div>
                        )}

                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Momentum Growth */}
                            <Card className="col-span-1 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle>Momentum Growth 🚀</CardTitle>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Your inconsistency trend over the last 30 days</p>
                                </CardHeader>
                                <CardContent>
                                    <GrowthAreaChart data={completionHistory || []} />
                                </CardContent>
                            </Card>

                            {/* Life Balance Radar */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle>Life Balance 🕸️</CardTitle>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Habit completions by category</p>
                                </CardHeader>
                                <CardContent>
                                    <CategoryRadarChart data={categoryStats || []} />
                                </CardContent>
                            </Card>

                            {/* Habit Distribution Donut */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle>Focus Areas 🍩</CardTitle>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Distribution of active habits</p>
                                </CardHeader>
                                <CardContent>
                                    <HabitDistributionChart data={habitDistribution || []} />
                                </CardContent>
                            </Card>

                            {/* Mood Chart */}
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle>Mood Trends 🌊</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <MoodChart data={moodStats || []} />
                                </CardContent>
                            </Card>

                            {/* Weekly Report */}
                            {weeklySummary && (
                                <Card className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle>Weekly Snapshot 📅</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <WeeklyReport data={weeklySummary} />
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Productivity Heatmap */}
                        <Card className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle>Consistency Heatmap 🔥</CardTitle>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Activity intensity over the last 3 months</p>
                            </CardHeader>
                            <CardContent>
                                <ProductivityHeatmap data={heatmapData || []} />
                            </CardContent>
                        </Card>

                        {/* Monthly Trend & Insights */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {monthlySummary && (
                                <Card className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle>Monthly Comparison 📊</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <MonthlyTrend data={monthlySummary} />
                                    </CardContent>
                                </Card>
                            )}

                            {/* Insights Card */}
                            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-900/30 border-l-4 border-l-indigo-500">
                                <CardHeader>
                                    <CardTitle>AI Insights 💡</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                                        {weeklySummary && weeklySummary.habitCompletionRate < 50 && (
                                            <li className="flex gap-2"><span className="text-xl">⚠️</span> Habit completion is low ({weeklySummary.habitCompletionRate}%). Focus on 1-2 key habits this week.</li>
                                        )}
                                        {overallStats && overallStats.longestStreak > 5 && (
                                            <li className="flex gap-2"><span className="text-xl">🔥</span> You're on fire! Longest streak is {overallStats.longestStreak} days. Don't break the chain!</li>
                                        )}
                                        {categoryStats && categoryStats.length > 0 && [...categoryStats].sort((a, b) => b.value - a.value)[0]?.category === 'Health' && (
                                            <li className="flex gap-2"><span className="text-xl">💪</span> You are prioritizing Health heavily. Great foundation!</li>
                                        )}
                                        <li className="flex gap-2"><span className="text-xl">✨</span> {monthlySummary?.trends.habits && monthlySummary.trends.habits > 0 ? `You're ${monthlySummary.trends.habits}% more consistent than last month!` : "Consistency is key. Keep showing up!"}</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function StatsCard({ label, value, color = "text-gray-900 dark:text-white" }: { label: string, value: string | number, color?: string }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center hover:scale-105 transition-transform duration-200">
            <p className={`text-xl md:text-2xl font-bold ${color} truncate`}>{value}</p>
            <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mt-1 truncate">{label}</p>
        </div>
    )
}
