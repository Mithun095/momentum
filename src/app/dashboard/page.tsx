'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Navbar } from '@/components/layout/Navbar'
import { AIFloatingButton } from '@/components/ai/AIFloatingButton'
import { EventCalendar } from '@/components/events/EventCalendar'
import { CreateEventModal } from '@/components/events/CreateEventModal'
import { api } from '@/lib/trpc/client'
import {
    CheckCircle2,
    Circle,
    Plus,
    ChevronRight,
    BookOpen,
    ListTodo,
    Target,
    Calendar,
    Sparkles,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [createEventOpen, setCreateEventOpen] = useState(false)

    // Date range for current month events
    const { monthStart, monthEnd } = useMemo(() => ({
        monthStart: startOfMonth(new Date()),
        monthEnd: endOfMonth(new Date()),
    }), [])

    // Today's date range
    const { todayStart, todayEnd } = useMemo(() => ({
        todayStart: startOfDay(new Date()),
        todayEnd: endOfDay(new Date()),
    }), [])

    // Queries
    const { data: habits, isLoading: habitsLoading } = api.habit.getAll.useQuery()
    const { data: completions } = api.habit.getAllCompletions.useQuery(
        { startDate: todayStart, endDate: todayEnd },
        { enabled: !!habits && habits.length > 0 }
    )
    const { data: tasks, isLoading: tasksLoading } = api.task.getToday.useQuery()
    const { data: events } = api.event.getByMonth.useQuery({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    })
    const { data: goals } = api.goal.getActive.useQuery()

    const utils = api.useUtils()

    // Complete habit mutation
    const completeHabit = api.habit.markComplete.useMutation({
        onSuccess: () => {
            // Invalidate all related queries for fresh data
            void utils.habit.getAllCompletions.invalidate()
            void utils.habit.getStats.invalidate()
            void utils.habit.getAll.invalidate()
        },
    })

    // Map of completed habits today
    const completedToday = useMemo(() => {
        if (!completions) return new Set<string>()
        return new Set(completions.map(c => c.habitId))
    }, [completions])

    // Stats
    const completedHabitsCount = completedToday.size
    const totalHabitsCount = habits?.length ?? 0
    const pendingTasksCount = tasks?.filter(t => t.status === 'pending').length ?? 0
    const activeGoalsCount = goals?.length ?? 0

    // Handle date click on calendar
    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setCreateEventOpen(true)
    }

    // Handle event click
    const handleEventClick = (event: { id: string }) => {
        // Could open edit modal here
    }

    // Calendar events formatted
    const calendarEvents = useMemo(() => {
        return events?.map(e => ({
            ...e,
            startTime: new Date(e.startTime),
            endTime: new Date(e.endTime),
        })) ?? []
    }, [events])

    const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 17) return 'Good afternoon'
        return 'Good evening'
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Skeleton className="h-12 w-64 mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-6">
                            <Skeleton className="h-48" />
                            <Skeleton className="h-64" />
                        </div>
                        <div className="lg:col-span-8">
                            <Skeleton className="h-[500px]" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/30 dark:from-gray-950 dark:via-gray-950 dark:to-indigo-950/20">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Greeting */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {greeting()}, {session?.user?.name?.split(' ')[0] || 'there'}! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Here's your overview for today
                    </p>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Link href="/dashboard/habits">
                        <Card className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {completedHabitsCount}/{totalHabitsCount}
                                        </p>
                                        <p className="text-sm text-gray-500">Habits</p>
                                    </div>
                                    <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/tasks">
                        <Card className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {pendingTasksCount}
                                        </p>
                                        <p className="text-sm text-gray-500">Tasks</p>
                                    </div>
                                    <ListTodo className="h-8 w-8 text-blue-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/goals">
                        <Card className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {activeGoalsCount}
                                        </p>
                                        <p className="text-sm text-gray-500">Goals</p>
                                    </div>
                                    <Target className="h-8 w-8 text-purple-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/dashboard/journal">
                        <Card className="hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            📖
                                        </p>
                                        <p className="text-sm text-gray-500">Journal</p>
                                    </div>
                                    <BookOpen className="h-8 w-8 text-orange-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Today's Habits */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold">Today's Habits</CardTitle>
                                    <Link href="/dashboard/habits">
                                        <Button variant="ghost" size="sm">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {habitsLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12" />
                                    ))
                                ) : habits && habits.length > 0 ? (
                                    habits.slice(0, 5).map((habit) => {
                                        const isCompleted = completedToday.has(habit.id)
                                        return (
                                            <div
                                                key={habit.id}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                                                    ${isCompleted
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700'
                                                    }
                                                `}
                                                onClick={() => {
                                                    if (!isCompleted) {
                                                        completeHabit.mutate({ habitId: habit.id, date: new Date() })
                                                    }
                                                }}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-gray-400" />
                                                )}
                                                <span className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                                    {habit.name}
                                                </span>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <p>No habits yet</p>
                                        <Link href="/dashboard/habits">
                                            <Button variant="link" size="sm">Create one</Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Tasks */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold">Today's Tasks</CardTitle>
                                    <Link href="/dashboard/tasks">
                                        <Button variant="ghost" size="sm">
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {tasksLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-12" />
                                    ))
                                ) : tasks && tasks.length > 0 ? (
                                    tasks.slice(0, 5).map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className={`
                                                w-2 h-2 rounded-full
                                                ${task.priority === 'high' ? 'bg-red-500' :
                                                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-gray-400'}
                                            `} />
                                            <span className="flex-1 text-gray-900 dark:text-white truncate">
                                                {task.title}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {task.priority}
                                            </Badge>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <p>No tasks for today</p>
                                        <Link href="/dashboard/tasks">
                                            <Button variant="link" size="sm">Add one</Button>
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Calendar */}
                    <div className="lg:col-span-8">
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-indigo-500" />
                                        Calendar
                                    </CardTitle>
                                    <Link href="/dashboard/events">
                                        <Button variant="outline" size="sm">
                                            View All Events
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <EventCalendar
                                    events={calendarEvents}
                                    onDateClick={handleDateClick}
                                    onEventClick={handleEventClick}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>

            {/* AI Floating Button */}
            <AIFloatingButton />

            {/* Create Event Modal */}
            <CreateEventModal
                open={createEventOpen}
                onOpenChange={setCreateEventOpen}
                defaultDate={selectedDate ?? undefined}
            />
        </div>
    )
}
