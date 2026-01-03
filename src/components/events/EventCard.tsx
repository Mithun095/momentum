'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Clock, MapPin, Calendar } from 'lucide-react'
import { format, isSameDay, isToday, isTomorrow } from 'date-fns'
import type { CalendarEvent } from '@/types/events'

interface EventCardProps {
    event: CalendarEvent
    onEdit: (event: CalendarEvent) => void
    onDelete: (id: string) => void
    compact?: boolean
}

const categoryColors: Record<string, string> = {
    work: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    social: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    family: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    education: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    finance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

function getDateLabel(date: Date): string {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE, MMM d')
}

export function EventCard({ event, onEdit, onDelete, compact = false }: EventCardProps) {
    const startDate = new Date(event.startTime)
    const endDate = new Date(event.endTime)
    const categoryClass = categoryColors[event.category || 'other'] || categoryColors.other

    const timeDisplay = event.isAllDay
        ? 'All Day'
        : isSameDay(startDate, endDate)
            ? `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`
            : `${format(startDate, 'MMM d, h:mm a')} - ${format(endDate, 'MMM d, h:mm a')}`

    if (compact) {
        return (
            <div
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                onClick={() => onEdit(event)}
                style={{ borderLeft: `4px solid ${event.color || '#3B82F6'}` }}
            >
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {timeDisplay}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(event.id)
                    }}
                >
                    <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        )
    }

    return (
        <Card className="group hover:shadow-lg transition-shadow" style={{ borderLeft: `4px solid ${event.color || '#3B82F6'}` }}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        {event.description && (
                            <CardDescription className="mt-1 line-clamp-2">
                                {event.description}
                            </CardDescription>
                        )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(event)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(event.id)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                    {event.category && (
                        <Badge className={categoryClass}>
                            {event.category}
                        </Badge>
                    )}
                    {event.isAllDay && (
                        <Badge variant="secondary">All Day</Badge>
                    )}
                </div>

                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{getDateLabel(startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{timeDisplay}</span>
                    </div>
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
