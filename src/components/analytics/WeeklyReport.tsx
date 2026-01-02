'use client'

interface WeeklyReportProps {
    data: {
        weekStart: string
        weekEnd: string
        habitsCompleted: number
        expectedHabitCompletions: number
        habitCompletionRate: number
        tasksCompleted: number
        tasksCreated: number
        journalEntries: number
        daysInWeek: number
    }
}

export function WeeklyReport({ data }: WeeklyReportProps) {
    const getProgressColor = (rate: number) => {
        if (rate >= 80) return 'bg-emerald-500'
        if (rate >= 60) return 'bg-yellow-500'
        if (rate >= 40) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const getEmoji = (rate: number) => {
        if (rate >= 80) return '🎉'
        if (rate >= 60) return '👍'
        if (rate >= 40) return '💪'
        return '🌱'
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Weekly Report
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {data.weekStart} - {data.weekEnd}
                    </p>
                </div>
                <div className="text-3xl">{getEmoji(data.habitCompletionRate)}</div>
            </div>

            {/* Habit Completion Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Habit Completion</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {data.habitCompletionRate}%
                    </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor(data.habitCompletionRate)} transition-all duration-500`}
                        style={{ width: `${Math.min(100, data.habitCompletionRate)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {data.habitsCompleted} of {data.expectedHabitCompletions} expected completions
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.habitsCompleted}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Habits Done</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.tasksCompleted}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tasks Done</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.journalEntries}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Journal Entries</p>
                </div>
            </div>

            {/* Task efficiency */}
            {data.tasksCreated > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Task efficiency:{' '}
                        <span className="font-medium text-gray-900 dark:text-white">
                            {Math.round((data.tasksCompleted / data.tasksCreated) * 100)}%
                        </span>
                        <span className="text-gray-500 ml-1">
                            ({data.tasksCompleted}/{data.tasksCreated})
                        </span>
                    </p>
                </div>
            )}
        </div>
    )
}
