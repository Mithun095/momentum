'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { TodayHabits } from '@/components/habits/TodayHabits'
import { api } from '@/lib/trpc/client'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { data: habits } = api.habit.getAll.useQuery(undefined, {
        enabled: !!session,
    })
    const { data: taskStats } = api.task.getStats.useQuery(undefined, {
        enabled: !!session,
    })
    const { data: todayTasks } = api.task.getToday.useQuery(undefined, {
        enabled: !!session,
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    const habitCount = habits?.length || 0

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                            Dashboard
                        </h1>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {session.user?.name || session.user?.email}
                            </span>
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-medium">
                                {session.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome back, {session.user?.name?.split(' ')[0] || 'there'}. Here's your overview.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link href="/dashboard/habits">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Habits</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{habitCount}</p>
                                </div>
                                <div className="text-4xl">✅</div>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Streak</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                            </div>
                            <div className="text-4xl">🔥</div>
                        </div>
                    </div>

                    <Link href="/dashboard/journal">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Journal Entries</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                                </div>
                                <div className="text-4xl">📔</div>
                            </div>
                        </div>
                    </Link>

                    <Link href="/dashboard/tasks">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasks Today</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {taskStats?.todayTasks || 0}
                                        </p>
                                        {taskStats?.overdue && taskStats.overdue > 0 && (
                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                                                {taskStats.overdue} overdue
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="text-4xl">📋</div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Today's Tasks Widget */}
                {todayTasks && todayTasks.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Today's Tasks
                            </h3>
                            <Link href="/dashboard/tasks" className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                                View all →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {todayTasks.slice(0, 5).map((task) => (
                                <div
                                    key={task.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${task.status === 'completed'
                                        ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 ${task.status === 'completed'
                                        ? 'bg-green-500 border-green-500'
                                        : task.priority === 'high'
                                            ? 'border-red-500'
                                            : task.priority === 'medium'
                                                ? 'border-yellow-500'
                                                : 'border-gray-400'
                                        }`} />
                                    <span className={`flex-1 ${task.status === 'completed'
                                        ? 'line-through text-gray-500 dark:text-gray-400'
                                        : 'text-gray-900 dark:text-gray-100'
                                        }`}>
                                        {task.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Today's Habits Widget */}
                <div className="mb-8">
                    <TodayHabits />
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link href="/dashboard/habits">
                            <button className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="text-3xl mb-2">➕</div>
                                <p className="font-medium text-gray-900 dark:text-white">Add Habit</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Start tracking a new habit</p>
                            </button>
                        </Link>

                        <Link href={`/dashboard/journal/${new Date().toISOString().split('T')[0]}`}>
                            <button className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="text-3xl mb-2">📝</div>
                                <p className="font-medium text-gray-900 dark:text-white">Write Journal</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Capture your thoughts</p>
                            </button>
                        </Link>

                        <Link href="/dashboard/tasks">
                            <button className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="text-3xl mb-2">✓</div>
                                <p className="font-medium text-gray-900 dark:text-white">Add Task</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Plan your next action</p>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

