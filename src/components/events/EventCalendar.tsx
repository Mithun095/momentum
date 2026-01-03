'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameMonth,
    isToday,
    addMonths,
    subMonths,
} from 'date-fns'
import type { CalendarEvent } from '@/types/events'

interface EventCalendarProps {
    events: CalendarEvent[]
    onDateClick: (date: Date) => void
    onEventClick: (event: CalendarEvent) => void
}

export function EventCalendar({ events, onDateClick, onEventClick }: EventCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const days = useMemo(() => {
        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const calendarStart = startOfWeek(monthStart)
        const calendarEnd = endOfWeek(monthEnd)

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    }, [currentMonth])

    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>()
        events.forEach((event) => {
            const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd')
            if (!map.has(dateKey)) {
                map.set(dateKey, [])
            }
            map.get(dateKey)!.push(event)
        })
        return map
    }, [events])

    const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const goToToday = () => setCurrentMonth(new Date())

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                        {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Today
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={goToNextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Week day headers */}
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                    {days.map((day) => {
                        const dateKey = format(day, 'yyyy-MM-dd')
                        const dayEvents = eventsByDate.get(dateKey) || []
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const isCurrentDay = isToday(day)

                        return (
                            <div
                                key={day.toISOString()}
                                className={`
                                    min-h-[100px] p-1 bg-white dark:bg-gray-900 cursor-pointer
                                    hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                                    ${!isCurrentMonth ? 'opacity-40' : ''}
                                `}
                                onClick={() => onDateClick(day)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${isCurrentDay
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-700 dark:text-gray-300'
                                            }
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                    {dayEvents.length > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {dayEvents.length}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                        <button
                                            key={event.id}
                                            className="w-full text-left text-xs p-1 rounded truncate text-white"
                                            style={{ backgroundColor: event.color || '#3B82F6' }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onEventClick(event)
                                            }}
                                        >
                                            {event.title}
                                        </button>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-gray-500 text-center">
                                            +{dayEvents.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
