'use client'

import Link from 'next/link'

interface WorkspaceCardProps {
    workspace: {
        id: string
        name: string
        description?: string | null
        type: string
        role: string
        memberCount: number
        habitCount: number
        members: Array<{
            user: {
                id: string
                name?: string | null
                email: string
                image?: string | null
            }
        }>
    }
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
    const roleColors: Record<string, string> = {
        owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        member: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }

    const typeIcons: Record<string, string> = {
        team: '👥',
        hr: '🏢',
        company: '🏛️'
    }

    const displayMembers = workspace.members.slice(0, 4)
    const extraMembers = workspace.memberCount - displayMembers.length

    return (
        <Link href={`/dashboard/workspace/${workspace.id}`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer group">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeIcons[workspace.type] || '👥'}</span>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {workspace.name}
                            </h3>
                            {workspace.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                    {workspace.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[workspace.role]}`}>
                        {workspace.role}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{workspace.memberCount} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>✅</span>
                        <span>{workspace.habitCount} habits</span>
                    </div>
                </div>

                {/* Member Avatars */}
                <div className="flex items-center">
                    <div className="flex -space-x-2">
                        {displayMembers.map((member) => (
                            <div
                                key={member.user.id}
                                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300"
                                title={member.user.name || member.user.email}
                            >
                                {member.user.image ? (
                                    <img
                                        src={member.user.image}
                                        alt={member.user.name || ''}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    (member.user.name?.[0] || member.user.email[0]).toUpperCase()
                                )}
                            </div>
                        ))}
                        {extraMembers > 0 && (
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                                +{extraMembers}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
