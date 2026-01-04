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
    if (score === 0) return 'bg-gray-100 dark:bg-[#161b22]' // Empty: Light gray / Dark GitHub-like gray
    if (score <= 2) return 'bg-[#9be9a8] dark:bg-[#0e4429]' // Level 1
    if (score <= 5) return 'bg-[#40c463] dark:bg-[#006d32]' // Level 2
    if (score <= 8) return 'bg-[#30a14e] dark:bg-[#26a641]' // Level 3
    return 'bg-[#216e39] dark:bg-[#39d353]' // Level 4
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
        <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-fit mx-auto pr-4">
                {/* Month labels */}
                <div className="flex mb-2 ml-[38px]">
                    {months.map((m, i) => {
                        // Calculate margin based on gap-1 (0.25rem = 4px) + w-3 (12px) = 16px per col
                        // Previous implementation used exact pixels, let's use a rough multiplier
                        const diff = m.position - (months[i - 1]?.position || 0)
                        const margin = i === 0 ? 0 : (diff * 16) - 20 // Subtract approximate width of text to align better

                        // actually, simplified approach: just render absolute or use grid?
                        // Sticking to margin for now but careful with the math.
                        // 1 col = 16px. 
                        const exactMargin = i === 0 ? 0 : (diff * 16)

                        return (
                            <div
                                key={`${m.label}-${i}`}
                                className="text-xs font-medium text-gray-500 dark:text-gray-400 text-left"
                                style={{
                                    marginLeft: i === 0 ? 0 : `${Math.max(0, exactMargin - 25)}px`,
                                    minWidth: '30px'
                                }}
                            >
                                {m.label}
                            </div>
                        )
                    })}
                </div>

                <div className="flex">
                    {/* Day labels */}
                    <div className="flex flex-col mr-3 gap-[3px] py-[1px]">
                        {dayLabels.map((day, i) => (
                            <div key={day} className="h-3 text-[10px] text-gray-400 dark:text-gray-500 flex items-center leading-none">
                                {i % 2 === 1 ? day : ''}
                            </div>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="flex gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                                {week.map((day, dayIndex) => (
                                    <div
                                        key={`${weekIndex}-${dayIndex}`}
                                        className={`w-3 h-3 rounded-[2px] transition-all duration-200 ${day ? getIntensityClass(day.score) : 'bg-transparent'} hover:opacity-80 hover:scale-110 cursor-help`}
                                        title={
                                            day
                                                ? `${day.date}\nScore: ${day.score}\n${day.habits} habits, ${day.tasks} tasks, ${day.journals} journals`
                                                : ''
                                        }
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-6 text-xs text-gray-500 dark:text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-[2px] bg-gray-100 dark:bg-[#161b22] border border-gray-200 dark:border-transparent" />
                        <div className="w-3 h-3 rounded-[2px] bg-[#9be9a8] dark:bg-[#0e4429]" />
                        <div className="w-3 h-3 rounded-[2px] bg-[#40c463] dark:bg-[#006d32]" />
                        <div className="w-3 h-3 rounded-[2px] bg-[#30a14e] dark:bg-[#26a641]" />
                        <div className="w-3 h-3 rounded-[2px] bg-[#216e39] dark:bg-[#39d353]" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </div>
    )
}
