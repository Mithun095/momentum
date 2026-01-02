'use client'

import { formatDistanceToNow } from 'date-fns'

interface ActivityItem {
    id: string
    type: 'habit_completion' | 'member_joined' | 'habit_created'
    userId: string
    userName: string | null
    userEmail: string
    habitName?: string
    timestamp: Date
}

interface ActivityFeedProps {
    activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📋 Activity Feed</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No activity yet. Start completing habits!
                </p>
            </div>
        )
    }

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'habit_completion': return '✅'
            case 'member_joined': return '👋'
            case 'habit_created': return '➕'
            default: return '📝'
        }
    }

    const getActivityText = (activity: ActivityItem) => {
        const name = activity.userName || activity.userEmail.split('@')[0]
        switch (activity.type) {
            case 'habit_completion':
                return (
                    <>
                        <span className="font-medium">{name}</span> completed{' '}
                        <span className="font-medium">{activity.habitName}</span>
                    </>
                )
            case 'member_joined':
                return (
                    <>
                        <span className="font-medium">{name}</span> joined the workspace
                    </>
                )
            case 'habit_created':
                return (
                    <>
                        <span className="font-medium">{name}</span> created habit{' '}
                        <span className="font-medium">{activity.habitName}</span>
                    </>
                )
            default:
                return null
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📋 Activity Feed</h3>

            <div className="space-y-3 max-h-80 overflow-y-auto">
                {activities.map((activity) => (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                        <span className="text-lg mt-0.5">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {getActivityText(activity)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
