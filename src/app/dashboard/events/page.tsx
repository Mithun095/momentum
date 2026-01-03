'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calendar, List } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { EventCalendar } from '@/components/events/EventCalendar'
import { EventCard } from '@/components/events/EventCard'
import { CreateEventModal } from '@/components/events/CreateEventModal'
import { EditEventModal } from '@/components/events/EditEventModal'
import { startOfMonth, endOfMonth } from 'date-fns'
import type { CalendarEvent } from '@/types/events'

export default function EventsPage() {
    const [view, setView] = useState<'calendar' | 'list'>('calendar')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
    const { toast } = useToast()
    const utils = api.useUtils()

    const today = new Date()
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    const { data: events, isLoading } = api.event.getByDateRange.useQuery({
        startDate: new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1),
        endDate: new Date(monthEnd.getFullYear(), monthEnd.getMonth() + 2, 0),
    })

    const { data: upcomingEvents } = api.event.getUpcoming.useQuery({ days: 7 })

    const deleteEvent = api.event.delete.useMutation({
        onSuccess: () => {
            toast({ title: 'Event deleted', description: 'The event has been removed.' })
            void utils.event.getAll.invalidate()
            void utils.event.getByDateRange.invalidate()
            void utils.event.getUpcoming.invalidate()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
    })

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setShowCreateModal(true)
    }

    const handleEventClick = (event: CalendarEvent) => {
        setEditingEvent(event)
    }

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            deleteEvent.mutate({ id })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Events
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage your calendar and upcoming events
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <Button
                                variant={view === 'calendar' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('calendar')}
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Calendar
                            </Button>
                            <Button
                                variant={view === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setView('list')}
                            >
                                <List className="h-4 w-4 mr-2" />
                                List
                            </Button>
                        </div>
                        <Button onClick={() => {
                            setSelectedDate(undefined)
                            setShowCreateModal(true)
                        }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Event
                        </Button>
                    </div>
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar / List View */}
                    <div className="lg:col-span-3">
                        {isLoading ? (
                            <Card>
                                <CardContent className="p-6">
                                    <Skeleton className="h-[500px] w-full" />
                                </CardContent>
                            </Card>
                        ) : view === 'calendar' ? (
                            <EventCalendar
                                events={events || []}
                                onDateClick={handleDateClick}
                                onEventClick={handleEventClick}
                            />
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>All Events</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {!events || events.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">📅</div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                                                No events yet
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Create your first event to get started
                                            </p>
                                            <Button onClick={() => setShowCreateModal(true)}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Event
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {events.map((event) => (
                                                <EventCard
                                                    key={event.id}
                                                    event={event}
                                                    onEdit={setEditingEvent}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Upcoming Events */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Upcoming Events</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!upcomingEvents || upcomingEvents.length === 0 ? (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                                        No upcoming events in the next 7 days
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {upcomingEvents.map((event) => (
                                            <EventCard
                                                key={event.id}
                                                event={event}
                                                onEdit={setEditingEvent}
                                                onDelete={handleDelete}
                                                compact
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick stats */}
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-lg">This Month</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                        {events?.length || 0}
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        Events scheduled
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CreateEventModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                defaultDate={selectedDate}
            />

            {editingEvent && (
                <EditEventModal
                    event={editingEvent}
                    open={!!editingEvent}
                    onOpenChange={(open) => !open && setEditingEvent(null)}
                />
            )}
        </div>
    )
}
