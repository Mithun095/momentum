'use client'

import { ArrowUp, ArrowDown, Minus, CheckSquare, ClipboardList, Book } from 'lucide-react'

interface MonthlyTrendProps {
    data: {
        monthName: string
        current: {
            habitsCompleted: number
            tasksCompleted: number
            journalEntries: number
        }
        previous: {
            habitsCompleted: number
            tasksCompleted: number
            journalEntries: number
        }
        trends: {
            habits: number
            tasks: number
            journals: number
        }
    }
}

export function MonthlyTrend({ data }: MonthlyTrendProps) {
    const getTrendIcon = (trend: number) => {
        if (trend > 0) return <ArrowUp className="w-5 h-5" />
        if (trend < 0) return <ArrowDown className="w-5 h-5" />
        return <Minus className="w-5 h-5" />
    }

    const getTrendColor = (trend: number) => {
        if (trend > 0) return 'text-emerald-500'
        if (trend < 0) return 'text-red-500'
        return 'text-gray-500'
    }

    const stats = [
        {
            label: 'Habits Completed',
            value: data.current.habitsCompleted,
            previous: data.previous.habitsCompleted,
            trend: data.trends.habits,
            icon: <CheckSquare className="w-6 h-6 text-emerald-500" />
        },
        {
            label: 'Tasks Completed',
            value: data.current.tasksCompleted,
            previous: data.previous.tasksCompleted,
            trend: data.trends.tasks,
            icon: <ClipboardList className="w-6 h-6 text-blue-500" />
        },
        {
            label: 'Journal Entries',
            value: data.current.journalEntries,
            previous: data.previous.journalEntries,
            trend: data.trends.journals,
            icon: <Book className="w-6 h-6 text-purple-500" />
        }
    ]

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {data.monthName}
            </h3>

            <div className="space-y-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {stat.icon}
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`flex items-center gap-1 ${getTrendColor(stat.trend)}`}>
                                <span className="flex items-center justify-center w-5 h-5">{getTrendIcon(stat.trend)}</span>
                                <span className="font-medium">
                                    {Math.abs(stat.trend)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                vs last month ({stat.previous})
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
