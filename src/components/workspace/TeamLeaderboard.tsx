'use client'

interface LeaderboardEntry {
    userId: string
    userName: string | null
    userEmail: string
    completions: number
    rank: number
}

interface TeamLeaderboardProps {
    entries: LeaderboardEntry[]
    currentUserId: string
}

export function TeamLeaderboard({ entries, currentUserId }: TeamLeaderboardProps) {
    if (entries.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏆 Team Leaderboard</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Complete habits to appear on the leaderboard!
                </p>
            </div>
        )
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1: return '🥇'
            case 2: return '🥈'
            case 3: return '🥉'
            default: return `#${rank}`
        }
    }

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1: return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            case 2: return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
            case 3: return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            default: return 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏆 Team Leaderboard</h3>

            <div className="space-y-2">
                {entries.map((entry) => {
                    const isCurrentUser = entry.userId === currentUserId

                    return (
                        <div
                            key={entry.userId}
                            className={`flex items-center justify-between p-3 rounded-lg border ${getRankStyle(entry.rank)} ${isCurrentUser ? 'ring-2 ring-purple-500' : ''
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl w-8 text-center">
                                    {getRankIcon(entry.rank)}
                                </span>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {entry.userName || entry.userEmail.split('@')[0]}
                                        {isCurrentUser && (
                                            <span className="text-xs text-purple-600 dark:text-purple-400 ml-1">(you)</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {entry.completions}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    completions
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
