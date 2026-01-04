'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

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

const getIntensityClass = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-[#161b22]' // Empty
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/30' // Level 1
    if (count <= 4) return 'bg-emerald-300 dark:bg-emerald-800/50' // Level 2
    if (count <= 6) return 'bg-emerald-400 dark:bg-emerald-600/70' // Level 3
    return 'bg-emerald-500 dark:bg-emerald-500' // Level 4
}

export function ProductivityHeatmap({ data }: ProductivityHeatmapProps) {
    const [hoveredDay, setHoveredDay] = useState<{ data: HeatmapData, x: number, y: number } | null>(null)

    // Configuration for rendering
    // cell size: 14px (w-3.5)
    // gap: 6px (gap-1.5)
    // total col width: 20px
    const CELL_SIZE_CLASS = "w-3.5 h-3.5"
    const COL_WIDTH = 20;

    const { weeks, monthLabels } = useMemo(() => {
        if (!data || data.length === 0) return { weeks: [], monthLabels: [] }

        // Sort data chronologically
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date))

        // Ensure we cover the full range from first to last date (filling gaps if necessary)
        const startDate = new Date(sortedData[0].date)
        const endDate = new Date(sortedData[sortedData.length - 1].date)

        // Align start date to the previous Sunday
        const startDayParams = startDate.getDay()
        const alignedStartDate = new Date(startDate)
        alignedStartDate.setDate(startDate.getDate() - startDayParams)

        // Generate full array of days
        const allDays: (HeatmapData | null)[] = []
        const dateMap = new Map(sortedData.map(d => [d.date, d]))

        const currentDate = new Date(alignedStartDate)
        while (currentDate <= endDate || currentDate.getDay() !== 0) {
            const dateStr = currentDate.toISOString().split('T')[0]
            allDays.push(dateMap.get(dateStr) || { date: dateStr, habits: 0, tasks: 0, journals: 0, score: 0 })
            currentDate.setDate(currentDate.getDate() + 1)
            if (currentDate.getFullYear() > endDate.getFullYear() + 1) break;
        }

        // Chunk into weeks
        const weeks: (HeatmapData | null)[][] = []
        let currentWeek: (HeatmapData | null)[] = []

        allDays.forEach((day, index) => {
            currentWeek.push(day)
            if ((index + 1) % 7 === 0) {
                weeks.push(currentWeek)
                currentWeek = []
            }
        })

        // Month labels
        const monthLabels: { label: string, index: number }[] = []
        let lastMonth = ''

        weeks.forEach((week, index) => {
            if (!week[0]) return
            // Identify the month based on the first day of the week, or the first day of the month if it falls in this week
            // Standard approach: if a week contains the 1st of a month, label it above that week column
            const hasFirstOfMonth = week.some(d => d && new Date(d.date).getDate() === 1)
            const firstDayOfWeek = new Date(week[0].date)
            const monthName = firstDayOfWeek.toLocaleString('default', { month: 'short' })

            // Logic: Place label if it's the 1st of month OR if it's the very first column
            if (hasFirstOfMonth || (index === 0)) {
                // But don't duplicate if we just added it (e.g. 1st appears but we already labeled prev week due to boundary)
                // Actually, simplify: just label when month changes based on `hasFirstOfMonth`

                // If the week contains the 1st, we DEFINITELY label it with the new month name
                const dayFirst = week.find(d => d && new Date(d.date).getDate() === 1)
                if (dayFirst) {
                    const mName = new Date(dayFirst.date).toLocaleString('default', { month: 'short' })
                    monthLabels.push({ label: mName, index: index })
                } else if (index === 0) {
                    monthLabels.push({ label: monthName, index: 0 })
                }
            }
        })

        return { weeks, monthLabels }
    }, [data])

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                <CalendarDays className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3 opacity-50" />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No activity recorded yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Consistency starts today!</p>
            </div>
        )
    }

    const dayLabels = ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']

    return (
        <div className="w-full relative group">
            <div className="flex flex-col gap-2">
                {/* Scroll Container */}
                <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
                    <div className="min-w-max">
                        {/* Month Labels */}
                        <div className="flex text-xs text-gray-400 dark:text-gray-500 mb-2 h-4 relative">
                            {/* Offset for day labels column */}
                            <div className="w-8 shrink-0 mr-1" />

                            {/* Labels Container - Position absolute relative to the weeks container would be ideal, 
                               but here we mimic with relative + absolute children */}
                            <div className="relative flex-1">
                                {monthLabels.map((m, i) => (
                                    <div
                                        key={`${m.label}-${i}`}
                                        className="absolute font-medium"
                                        style={{ left: `${m.index * COL_WIDTH}px` }}
                                    >
                                        {m.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-start gap-1">
                            {/* Day Labels Column */}
                            <div className="flex flex-col gap-[6px] mt-[1px] w-8 shrink-0">
                                {dayLabels.map((day, i) => (
                                    <div key={i} className={`h-3.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 flex items-center leading-none ${!day ? 'invisible' : ''}`}>
                                        {day || '-'}
                                    </div>
                                ))}
                            </div>

                            {/* Heatmap Grid */}
                            <div className="flex gap-1.5">
                                {weeks.map((week, wIndex) => (
                                    <div key={wIndex} className="flex flex-col gap-1.5">
                                        {week.map((day, dIndex) => (
                                            <div
                                                key={`${wIndex}-${dIndex}`}
                                                className={cn(
                                                    CELL_SIZE_CLASS,
                                                    "rounded-sm transition-all duration-300",
                                                    day ? getIntensityClass(day.habits + day.tasks + day.journals) : "bg-transparent",
                                                    "hover:scale-125 hover:z-10 relative cursor-pointer"
                                                )}
                                                onMouseEnter={(e) => {
                                                    if (day) {
                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                        setHoveredDay({ data: day, x: rect.left + rect.width / 2, y: rect.top })
                                                    }
                                                }}
                                                onMouseLeave={() => setHoveredDay(null)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-3 mt-4">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Contribution Level</span>
                    <div className="flex gap-1.5">
                        <div className={cn(CELL_SIZE_CLASS, "rounded-sm bg-gray-100 dark:bg-[#161b22]")} />
                        <div className={cn(CELL_SIZE_CLASS, "rounded-sm bg-emerald-200 dark:bg-emerald-900/30")} />
                        <div className={cn(CELL_SIZE_CLASS, "rounded-sm bg-emerald-300 dark:bg-emerald-800/50")} />
                        <div className={cn(CELL_SIZE_CLASS, "rounded-sm bg-emerald-400 dark:bg-emerald-600/70")} />
                        <div className={cn(CELL_SIZE_CLASS, "rounded-sm bg-emerald-500 dark:bg-emerald-500")} />
                    </div>
                </div>
            </div>

            {/* Floating Tooltip Portal */}
            <AnimatePresence>
                {hoveredDay && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                        <motion.div
                            initial={{ opacity: 0, y: 5, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 2, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            style={{
                                position: 'absolute',
                                left: hoveredDay.x,
                                top: hoveredDay.y - 10,
                                transform: 'translate(-50%, -100%)'
                            }}
                            className="bg-gray-900/95 backdrop-blur-sm dark:bg-gray-800/95 text-white text-xs rounded-xl py-3 px-4 shadow-xl border border-gray-700/50 min-w-[160px]"
                        >
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700/50">
                                <span className="font-semibold text-gray-200">
                                    {new Date(hoveredDay.data.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold",
                                    (hoveredDay.data.habits + hoveredDay.data.tasks + hoveredDay.data.journals) >= 5 ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700 text-gray-400"
                                )}>
                                    {hoveredDay.data.habits + hoveredDay.data.tasks + hoveredDay.data.journals} activities
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="flex flex-col bg-gray-800/50 rounded p-1">
                                    <span className="text-[10px] text-gray-500 uppercase">Habits</span>
                                    <span className="font-mono font-medium text-emerald-400">{hoveredDay.data.habits}</span>
                                </div>
                                <div className="flex flex-col bg-gray-800/50 rounded p-1">
                                    <span className="text-[10px] text-gray-500 uppercase">Tasks</span>
                                    <span className="font-mono font-medium text-blue-400">{hoveredDay.data.tasks}</span>
                                </div>
                                <div className="flex flex-col bg-gray-800/50 rounded p-1">
                                    <span className="text-[10px] text-gray-500 uppercase">Journal</span>
                                    <span className="font-mono font-medium text-purple-400">{hoveredDay.data.journals}</span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900/95 dark:border-t-gray-800/95" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
