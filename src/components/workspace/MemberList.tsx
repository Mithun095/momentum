'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'

interface Member {
    user: {
        id: string
        name?: string | null
        email: string
        image?: string | null
    }
    role: string
    joinedAt: Date
}

interface MemberListProps {
    workspaceId: string
    members: Member[]
    currentUserRole: string
    currentUserId: string
    onInvite: () => void
}

export function MemberList({ workspaceId, members, currentUserRole, currentUserId, onInvite }: MemberListProps) {
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [changingRoleId, setChangingRoleId] = useState<string | null>(null)

    const utils = api.useUtils()

    const removeMutation = api.workspace.removeMember.useMutation({
        onSuccess: () => {
            utils.workspace.getById.invalidate({ id: workspaceId })
            setRemovingId(null)
        }
    })

    const updateRoleMutation = api.workspace.updateMemberRole.useMutation({
        onSuccess: () => {
            utils.workspace.getById.invalidate({ id: workspaceId })
            setChangingRoleId(null)
        }
    })

    const leaveMutation = api.workspace.leave.useMutation({
        onSuccess: () => {
            window.location.href = '/dashboard/workspace'
        }
    })

    const canManage = ['owner', 'admin'].includes(currentUserRole)
    const isOwner = currentUserRole === 'owner'

    const roleColors: Record<string, string> = {
        owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        member: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    }

    const handleRemove = (userId: string) => {
        if (confirm('Are you sure you want to remove this member?')) {
            setRemovingId(userId)
            removeMutation.mutate({ workspaceId, userId })
        }
    }

    const handleRoleChange = (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
        setChangingRoleId(userId)
        updateRoleMutation.mutate({ workspaceId, userId, role: newRole })
    }

    const handleLeave = () => {
        if (confirm('Are you sure you want to leave this workspace?')) {
            leaveMutation.mutate({ workspaceId })
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                    Members ({members.length})
                </h3>
                {canManage && (
                    <button
                        onClick={onInvite}
                        className="text-sm px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                        + Invite
                    </button>
                )}
            </div>

            {/* Member List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {members.map((member) => {
                    const isCurrentUser = member.user.id === currentUserId
                    const canEditMember = isOwner && !isCurrentUser && member.role !== 'owner'

                    return (
                        <div key={member.user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
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
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {member.user.name || 'No name'}
                                        {isCurrentUser && <span className="text-gray-500 ml-1">(you)</span>}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {member.user.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {canEditMember ? (
                                    <select
                                        value={member.role}
                                        onChange={(e) => handleRoleChange(member.user.id, e.target.value as 'admin' | 'member' | 'viewer')}
                                        disabled={changingRoleId === member.user.id}
                                        className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="member">Member</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                ) : (
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[member.role]}`}>
                                        {member.role}
                                    </span>
                                )}

                                {canEditMember && (
                                    <button
                                        onClick={() => handleRemove(member.user.id)}
                                        disabled={removingId === member.user.id}
                                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                                        title="Remove member"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}

                                {isCurrentUser && member.role !== 'owner' && (
                                    <button
                                        onClick={handleLeave}
                                        disabled={leaveMutation.isPending}
                                        className="text-xs text-red-500 hover:text-red-700"
                                    >
                                        Leave
                                    </button>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
