'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Calendar, List, ArrowLeft } from 'lucide-react'
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
        <div className="min-h-screen">
            {/* Page Header */}
            <div className="bg-white/70 dark:bg-[oklch(0.12_0.025_265/70%)] backdrop-blur-xl border-b border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2 flex-shrink-0">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1
                                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                Calendar
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="hidden sm:flex items-center bg-gray-100/50 dark:bg-black/20 rounded-lg p-0.5 border border-gray-200/60 dark:border-white/5 mr-2">
                                <Button
                                    variant={view === 'calendar' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setView('calendar')}
                                    className={`h-8 ${view === 'calendar' ? 'bg-white dark:bg-[oklch(0.18_0.03_265)] text-gray-900 dark:text-white shadow-sm' : ''}`}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Grid
                                </Button>
                                <Button
                                    variant={view === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setView('list')}
                                    className={`h-8 ${view === 'list' ? 'bg-white dark:bg-[oklch(0.18_0.03_265)] text-gray-900 dark:text-white shadow-sm' : ''}`}
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    List
                                </Button>
                            </div>
                            <Button
                                onClick={() => {
                                    setSelectedDate(undefined)
                                    setShowCreateModal(true)
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add Event</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar / List View */}
                    <div className="lg:col-span-3">
                        {isLoading ? (
                            <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                                <CardContent className="p-6">
                                    <Skeleton className="h-[500px] w-full" />
                                </CardContent>
                            </Card>
                        ) : view === 'calendar' ? (
                            <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)] overflow-hidden">
                                <CardContent className="p-0 sm:p-4">
                                    <EventCalendar
                                        events={events || []}
                                        onDateClick={handleDateClick}
                                        onEventClick={handleEventClick}
                                    />
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)] overflow-hidden">
                                <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
                                    <CardTitle>All Events</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {!events || events.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-6xl mb-4">📅</div>
                                            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                                                No events yet
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                                Create your first event to get started
                                            </p>
                                            <Button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 dark:bg-indigo-500 text-white">
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
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                            <CardHeader className="pb-3 border-b border-gray-100 dark:border-white/5 mb-3">
                                <CardTitle className="text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                                    Upcoming Events
                                </CardTitle>
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
                        <Card className="border-0 shadow-sm dark:bg-[oklch(0.15_0.025_265)]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg" style={{ fontFamily: 'var(--font-heading)' }}>
                                    This Month
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-4">
                                    <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums mb-1">
                                        {events?.length || 0}
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
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
