'use client'

interface ToolActionCardProps {
    toolCall: {
        name: string
        args: Record<string, unknown>
        result?: unknown
    }
}

export function ToolActionCard({ toolCall }: ToolActionCardProps) {
    const result = toolCall.result as Record<string, unknown> | undefined

    const getToolIcon = (name: string) => {
        switch (name) {
            case 'createTask': return '📋'
            case 'createHabit': return '✅'
            case 'suggestHabits': return '💡'
            case 'getInsights': return '📊'
            case 'analyzeMood': return '🧠'
            default: return '⚡'
        }
    }

    const getToolTitle = (name: string) => {
        switch (name) {
            case 'createTask': return 'Task Created'
            case 'createHabit': return 'Habit Created'
            case 'suggestHabits': return 'Habit Suggestions'
            case 'getInsights': return 'Insights'
            case 'analyzeMood': return 'Mood Analysis'
            default: return 'Action Completed'
        }
    }

    const getStatusColor = () => {
        if (!result) return 'bg-gray-100 dark:bg-gray-700'
        if ('success' in result && result.success === false) {
            return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
    }

    const renderContent = () => {
        if (!result) return null

        switch (toolCall.name) {
            case 'createTask':
            case 'createHabit': {
                const taskResult = result as { success: boolean; title?: string; name?: string; message: string; dueDate?: string }
                return (
                    <div className="space-y-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                            {taskResult.title || taskResult.name}
                        </p>
                        {taskResult.dueDate && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Due: {taskResult.dueDate}
                            </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {taskResult.message}
                        </p>
                    </div>
                )
            }

            case 'suggestHabits': {
                const suggestions = result as unknown as Array<{ name: string; description: string; reason: string }>
                return (
                    <div className="space-y-2">
                        {suggestions.map((s, i) => (
                            <div key={i} className="p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{s.description}</p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{s.reason}</p>
                            </div>
                        ))}
                    </div>
                )
            }

            case 'getInsights': {
                const insights = result as { period: string; habitsCompleted: number; tasksCompleted: number; streakDays: number; summary: string }
                return (
                    <div className="space-y-2">
                        <div className="flex gap-4 text-sm">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-emerald-600">{insights.habitsCompleted}</p>
                                <p className="text-gray-500">habits</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{insights.tasksCompleted}</p>
                                <p className="text-gray-500">tasks</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-orange-500">{insights.streakDays}</p>
                                <p className="text-gray-500">streak</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{insights.summary}</p>
                    </div>
                )
            }

            case 'analyzeMood': {
                const analysis = result as { dominantMood: string; moodTrend: string; entries: number; summary: string }
                const moodEmoji: Record<string, string> = { great: '😄', good: '🙂', okay: '😐', bad: '😔', terrible: '😢', unknown: '❓' }
                const trendEmoji: Record<string, string> = { improving: '📈', stable: '➡️', declining: '📉' }

                return (
                    <div className="space-y-2">
                        <div className="flex items-center gap-4">
                            <div className="text-3xl">{moodEmoji[analysis.dominantMood] || '😐'}</div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                    {analysis.dominantMood} mood
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {trendEmoji[analysis.moodTrend]} Trend: {analysis.moodTrend}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.summary}</p>
                    </div>
                )
            }

            default:
                return (
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                )
        }
    }

    return (
        <div className={`rounded-lg border p-3 my-2 ${getStatusColor()}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{getToolIcon(toolCall.name)}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getToolTitle(toolCall.name)}
                </span>
            </div>
            {renderContent()}
        </div>
    )
}
