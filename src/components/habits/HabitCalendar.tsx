'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface HabitCompletion {
    habitId: string
    completionDate: Date
    status: string
}

interface HabitCalendarProps {
    habitId?: string
    completions?: HabitCompletion[]
    onDateClick?: (date: Date) => void
}

export function HabitCalendar({ habitId, completions = [], onDateClick }: HabitCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const getCompletionStatus = (date: Date) => {
        const completion = completions.find(
            (c) => format(new Date(c.completionDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        return completion?.status || null
    }

    const getStatusColor = (status: string | null, isCurrentMonth: boolean) => {
        if (!status) return isCurrentMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-400'

        switch (status) {
            case 'completed':
                return 'bg-green-500 text-white hover:bg-green-600'
            case 'skipped':
                return 'bg-yellow-500 text-white hover:bg-yellow-600'
            case 'failed':
                return 'bg-red-500 text-white hover:bg-red-600'
            default:
                return 'hover:bg-gray-100 dark:hover:bg-gray-800'
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date())}
                        >
                            Today
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 gap-2">
                    {/* Week day headers */}
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 p-2"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {days.map((day) => {
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const status = getCompletionStatus(day)
                        const statusColor = getStatusColor(status, isCurrentMonth)

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => onDateClick && onDateClick(day)}
                                className={cn(
                                    'aspect-square p-2 text-sm rounded-lg transition-colors',
                                    statusColor,
                                    isToday(day) && 'ring-2 ring-blue-500',
                                    !isCurrentMonth && 'opacity-40'
                                )}
                            >
                                {format(day, 'd')}
                            </button>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-yellow-500" />
                        <span>Skipped</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-red-500" />
                        <span>Failed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-blue-500" />
                        <span>Today</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
