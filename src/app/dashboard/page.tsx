'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { TodayHabits } from '@/components/habits/TodayHabits'
import { api } from '@/lib/trpc/client'

export default function DashboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const { data: habits } = api.habit.getAll.useQuery(undefined, {
        enabled: !!session,
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Momentum
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {session.user?.name || session.user?.email}
                            </span>
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {session.user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {session.user?.name?.split(' ')[0] || 'there'}! 👋
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Here's your progress overview
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Habits</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{habitCount}</p>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Streak</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                            </div>
                            <div className="text-4xl">🔥</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Journal Entries</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                            </div>
                            <div className="text-4xl">📔</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tasks Today</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
                            </div>
                            <div className="text-4xl">📋</div>
                        </div>
                    </div>
                </div>

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

                        <button className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="text-3xl mb-2">✓</div>
                            <p className="font-medium text-gray-900 dark:text-white">Add Task</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Plan your next action</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
