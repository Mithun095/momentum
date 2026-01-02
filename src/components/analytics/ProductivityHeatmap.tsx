'use client'

import { useMemo } from 'react'

interface HeatmapData {
    date: string
    habits: number
    tasks: number
    journals: number
    score: number
}

interface ProductivityHeatmapProps {
    data: HeatmapData[]
}

const getIntensityClass = (score: number): string => {
    if (score === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (score <= 2) return 'bg-emerald-200 dark:bg-emerald-900'
    if (score <= 5) return 'bg-emerald-300 dark:bg-emerald-700'
    if (score <= 8) return 'bg-emerald-400 dark:bg-emerald-600'
    return 'bg-emerald-500 dark:bg-emerald-500'
}

export function ProductivityHeatmap({ data }: ProductivityHeatmapProps) {
    const { weeks, months } = useMemo(() => {
        if (data.length === 0) return { weeks: [], months: [] }

        // Group data by week
        const dataMap = new Map(data.map(d => [d.date, d]))
        const weeks: (HeatmapData | null)[][] = []
        let currentWeek: (HeatmapData | null)[] = []
        const monthLabels: { label: string; position: number }[] = []
        let lastMonth = ''

        // Start from the first date and go to today
        const sortedDates = [...data].sort((a, b) => a.date.localeCompare(b.date))
        if (sortedDates.length === 0) return { weeks: [], months: [] }

        const startDate = new Date(sortedDates[0].date)
        const endDate = new Date(sortedDates[sortedDates.length - 1].date)

        // Adjust start to Sunday
        const adjustedStart = new Date(startDate)
        adjustedStart.setDate(adjustedStart.getDate() - adjustedStart.getDay())

        let currentDate = new Date(adjustedStart)

        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0]
            const dayData = dataMap.get(dateStr) || null

            // Track month changes for labels
            const month = currentDate.toLocaleDateString('en-US', { month: 'short' })
            if (month !== lastMonth) {
                monthLabels.push({ label: month, position: weeks.length })
                lastMonth = month
            }

            currentWeek.push(dayData)

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
            }

            currentDate.setDate(currentDate.getDate() + 1)
        }

        // Add remaining days
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) {
                currentWeek.push(null)
            }
            weeks.push(currentWeek)
        }

        return { weeks, months: monthLabels }
    }, [data])

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-4xl mb-2">📅</p>
                    <p>No activity data yet</p>
                    <p className="text-sm">Complete habits, tasks, or write journals</p>
                </div>
            </div>
        )
    }

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="overflow-x-auto">
            {/* Month labels */}
            <div className="flex mb-1 ml-8">
                {months.map((m, i) => (
                    <div
                        key={`${m.label}-${i}`}
                        className="text-xs text-gray-500 dark:text-gray-400"
                        style={{ marginLeft: i === 0 ? 0 : `${(m.position - (months[i - 1]?.position || 0)) * 14}px` }}
                    >
                        {m.label}
                    </div>
                ))}
            </div>

            <div className="flex">
                {/* Day labels */}
                <div className="flex flex-col mr-2 text-xs text-gray-500 dark:text-gray-400">
                    {dayLabels.map((day, i) => (
                        <div key={day} className="h-3 flex items-center" style={{ marginBottom: '2px' }}>
                            {i % 2 === 1 ? day : ''}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex gap-[2px]">
                    {weeks.map((week, weekIndex) => (
                        <div key={`week-${weekIndex}`} className="flex flex-col gap-[2px]">
                            {week.map((day, dayIndex) => (
                                <div
                                    key={`${weekIndex}-${dayIndex}`}
                                    className={`w-3 h-3 rounded-sm transition-colors ${day ? getIntensityClass(day.score) : 'bg-transparent'
                                        }`}
                                    title={
                                        day
                                            ? `${day.date}\n${day.habits} habits, ${day.tasks} tasks, ${day.journals} journals`
                                            : ''
                                    }
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Less</span>
                <div className="flex gap-[2px]">
                    <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
                </div>
                <span>More</span>
            </div>
        </div>
    )
}
