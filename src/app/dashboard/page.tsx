'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { AIFloatingButton } from '@/components/ai/AIFloatingButton'
import { EventCalendar } from '@/components/events/EventCalendar'
import { CreateEventModal } from '@/components/events/CreateEventModal'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    BookOpen,
    ListTodo,
    Target,
    Calendar,
    Sparkles,
    PenLine,
    TrendingUp,
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
}

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const } }
}

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [createEventOpen, setCreateEventOpen] = useState(false)
    const { toast } = useToast()

    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    const { data: overview, isLoading } = api.dashboard.getOverview.useQuery({
        date: startOfDay(new Date()),
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
    })

    const habits = overview?.habits
    const completions = overview?.completions
    const tasks = overview?.tasks
    const events = overview?.events
    const goals = overview?.goals

    const habitsLoading = isLoading
    const tasksLoading = isLoading

    const utils = api.useUtils()

    const completeHabit = api.habit.markComplete.useMutation({
        onMutate: async (variables) => {
            await utils.dashboard.getOverview.cancel()
            const prev = utils.dashboard.getOverview.getData()
            if (prev) {
                utils.dashboard.getOverview.setData(undefined as any, (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        completions: [...(old.completions || []), {
                            id: 'temp-' + Math.random(),
                            habitId: variables.habitId,
                            completionDate: variables.date,
                            status: 'completed',
                            notes: null,
                            createdAt: new Date(),
                        }],
                    }
                })
            }
            return { prev }
        },
        onError: (err, _vars, context) => {
            if (context?.prev) utils.dashboard.getOverview.setData(undefined as any, context.prev as any)
            toast({ title: 'Error', description: err.message || 'Failed to complete habit', variant: 'destructive' })
        },
        onSettled: () => void utils.dashboard.getOverview.invalidate(),
    })

    const removeCompletion = api.habit.removeCompletion.useMutation({
        onMutate: async (variables) => {
            await utils.dashboard.getOverview.cancel()
            const prev = utils.dashboard.getOverview.getData()
            if (prev) {
                utils.dashboard.getOverview.setData(undefined as any, (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        completions: (old.completions || []).filter((c: any) => c.habitId !== variables.habitId),
                    }
                })
            }
            return { prev }
        },
        onError: (err, _vars, context) => {
            if (context?.prev) utils.dashboard.getOverview.setData(undefined as any, context.prev as any)
            toast({ title: 'Error', description: err.message || 'Failed to undo', variant: 'destructive' })
        },
        onSettled: () => void utils.dashboard.getOverview.invalidate(),
    })

    const toggleTask = api.task.toggleComplete.useMutation({
        onMutate: async ({ id }) => {
            await utils.dashboard.getOverview.cancel()
            const prev = utils.dashboard.getOverview.getData()
            if (prev) {
                utils.dashboard.getOverview.setData(undefined as any, (old: any) => {
                    if (!old) return old
                    return {
                        ...old,
                        tasks: (old.tasks || []).map((t: any) =>
                            t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
                        ),
                    }
                })
            }
            return { prev }
        },
        onError: (err, _vars, context) => {
            if (context?.prev) utils.dashboard.getOverview.setData(undefined as any, context.prev as any)
            toast({ title: 'Error', description: err.message || 'Failed to toggle task', variant: 'destructive' })
        },
        onSettled: () => void utils.dashboard.getOverview.invalidate(),
    })

    const completedToday = useMemo(() => {
        if (!completions) return new Set<string>()
        return new Set(completions.map(c => c.habitId))
    }, [completions])

    const completedHabitsCount = completedToday.size
    const totalHabitsCount = habits?.length ?? 0
    const pendingTasksCount = tasks?.filter(t => t.status === 'pending').length ?? 0
    const activeGoalsCount = goals?.length ?? 0

    const habitProgress = totalHabitsCount > 0 ? Math.min((completedHabitsCount / totalHabitsCount) * 100, 100) : 0
    const tasksTotal = tasks?.length ?? 0
    const tasksCompleted = tasksTotal - (tasks?.filter(t => t.status === 'pending').length ?? 0)
    const taskProgress = tasksTotal > 0 ? Math.min((tasksCompleted / tasksTotal) * 100, 100) : 0

    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        setCreateEventOpen(true)
    }

    const handleEventClick = (event: { id: string }) => { }

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
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Skeleton className="h-12 w-64 mb-2" />
                    <Skeleton className="h-5 w-48 mb-8" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-28 rounded-2xl" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-4 space-y-6">
                            <Skeleton className="h-48 rounded-2xl" />
                            <Skeleton className="h-64 rounded-2xl" />
                        </div>
                        <div className="lg:col-span-8">
                            <Skeleton className="h-[500px] rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Greeting */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1
                        className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight"
                        style={{ fontFamily: 'var(--font-heading)' }}
                    >
                        {greeting()}, {session?.user?.name?.split(' ')[0] || 'there'} ✨
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-base">
                        {format(new Date(), 'EEEE, MMMM d')} — Here&apos;s your overview for today
                    </p>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    <motion.div variants={fadeUp}>
                        <Link href="/dashboard/habits">
                            <Card className="group card-3d cursor-pointer overflow-hidden relative border-0 glass-card hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-4 sm:p-5 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                                                {completedHabitsCount}/{totalHabitsCount}
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Habits</p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 group-hover:scale-110 transition-transform duration-300">
                                            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>
                                    <Progress value={habitProgress} className="h-1.5 mt-3" />
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                        <Link href="/dashboard/tasks">
                            <Card className="group card-3d cursor-pointer overflow-hidden relative border-0 glass-card hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-4 sm:p-5 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                                                {pendingTasksCount}
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Tasks</p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform duration-300">
                                            <ListTodo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <Progress value={taskProgress} className="h-1.5 mt-3" />
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                        <Link href="/dashboard/goals">
                            <Card className="group card-3d cursor-pointer overflow-hidden relative border-0 glass-card hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-purple-500/5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-4 sm:p-5 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
                                                {activeGoalsCount}
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Goals</p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 group-hover:scale-110 transition-transform duration-300">
                                            <Target className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>

                    <motion.div variants={fadeUp}>
                        <Link href="/dashboard/journal">
                            <Card className="group card-3d cursor-pointer overflow-hidden relative border-0 glass-card hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5 opacity-60 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-4 sm:p-5 relative">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xl font-bold text-foreground">
                                                <PenLine className="h-5 w-5 inline" />
                                            </p>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">Journal</p>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 group-hover:scale-110 transition-transform duration-300">
                                            <BookOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Today's Habits */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                        >
                            <Card className="border-0 glass-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                                            Today&apos;s Habits
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20">
                                                <Progress value={habitProgress} className="h-1.5" />
                                            </div>
                                            <Link href="/dashboard/habits">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent/50">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-1.5">
                                    {habitsLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-12 rounded-xl" />
                                        ))
                                    ) : habits && habits.length > 0 ? (
                                        habits.slice(0, 5).map((habit) => {
                                            const isCompleted = completedToday.has(habit.id)
                                            return (
                                                <div
                                                    key={habit.id}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer
                                                        ${isCompleted
                                                            ? 'bg-emerald-500/8 dark:bg-emerald-500/5 border-emerald-500/20'
                                                            : 'hover:bg-accent/30 border-transparent hover:border-border/50'
                                                        }
                                                    `}
                                                    onClick={() => {
                                                        if (!isCompleted) {
                                                            completeHabit.mutate({ habitId: habit.id, date: new Date() })
                                                        } else {
                                                            removeCompletion.mutate({ habitId: habit.id, date: new Date() })
                                                        }
                                                    }}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                                    ) : (
                                                        <Circle className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                                                    )}
                                                    <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                        {habit.name}
                                                    </span>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No habits yet</p>
                                            <Link href="/dashboard/habits">
                                                <Button variant="link" size="sm" className="mt-1 text-xs">Create one →</Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Today's Tasks */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                        >
                            <Card className="border-0 glass-card">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                                            Today&apos;s Tasks
                                        </CardTitle>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20">
                                                <Progress value={taskProgress} className="h-1.5" />
                                            </div>
                                            <Link href="/dashboard/tasks">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent/50">
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-1.5">
                                    {tasksLoading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <Skeleton key={i} className="h-12 rounded-xl" />
                                        ))
                                    ) : tasks && tasks.length > 0 ? (
                                        tasks.slice(0, 5).map((task) => {
                                            const isCompleted = task.status === 'completed'
                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer
                                                        ${isCompleted
                                                            ? 'bg-blue-500/8 dark:bg-blue-500/5 border-blue-500/20'
                                                            : 'hover:bg-accent/30 border-transparent hover:border-border/50'
                                                        }
                                                    `}
                                                    onClick={() => toggleTask.mutate({ id: task.id })}
                                                >
                                                    <div className={`
                                                        flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all flex-shrink-0
                                                        ${isCompleted
                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                            : 'border-muted-foreground/30 hover:border-blue-400'
                                                        }
                                                    `}>
                                                        {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                                                    </div>
                                                    <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'} truncate`}>
                                                        {task.title}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-[10px] px-1.5 py-0 font-medium border-0 ${task.priority === 'high'
                                                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                            : task.priority === 'medium'
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                : 'bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {task.priority}
                                                    </Badge>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No tasks for today</p>
                                            <Link href="/dashboard/tasks">
                                                <Button variant="link" size="sm" className="mt-1 text-xs">Add one →</Button>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right: Calendar */}
                    <div className="lg:col-span-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.35 }}
                        >
                            <Card className="h-full border-0 glass-card">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                                            <Calendar className="h-4 w-4 text-indigo-500" />
                                            Calendar
                                        </CardTitle>
                                        <Link href="/dashboard/events">
                                            <Button variant="outline" size="sm" className="text-xs h-8 glass border-border/50 hover:bg-accent/50">
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
                        </motion.div>
                    </div>
                </div>

                <AIFloatingButton />

                <CreateEventModal
                    open={createEventOpen}
                    onOpenChange={setCreateEventOpen}
                    defaultDate={selectedDate ?? undefined}
                />
            </main>
        </div>
    )
}
