'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import {
    ArrowLeft, Users, Target, Plus, Check, Crown, Shield, User,
    UserPlus, Trash2, Settings, MoreVertical, CheckCircle2
} from 'lucide-react'
import { format } from 'date-fns'

// Role badge component
function RoleBadge({ role }: { role: string }) {
    const config = {
        owner: { icon: Crown, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
        admin: { icon: Shield, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
        member: { icon: User, className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
        viewer: { icon: User, className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500' }
    }[role] || { icon: User, className: 'bg-gray-100 text-gray-700' }

    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
            <Icon className="h-3 w-3" />
            {role}
        </span>
    )
}

// Invite member modal
function InviteMemberModal({ workspaceId, onClose, onInvited }: { workspaceId: string; onClose: () => void; onInvited: () => void }) {
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'admin' | 'member' | 'viewer'>('member')
    const { toast } = useToast()

    const inviteMutation = api.workspace.inviteMember.useMutation({
        onSuccess: () => {
            toast({ title: 'Member invited!', description: 'They have been added to the workspace.' })
            onInvited()
            onClose()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return
        inviteMutation.mutate({ workspaceId, email, role })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Member
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@example.com"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">The user must already have an account</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Role
                            </label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'admin' | 'member' | 'viewer')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                <option value="admin">Admin - Can manage habits and members</option>
                                <option value="member">Member - Can complete habits</option>
                                <option value="viewer">Viewer - Can only view</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={inviteMutation.isPending || !email.trim()}
                                className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            >
                                {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

// Create habit modal
function CreateHabitModal({ workspaceId, onClose, onCreated }: { workspaceId: string; onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const { toast } = useToast()

    const createMutation = api.sharedHabit.create.useMutation({
        onSuccess: () => {
            toast({ title: 'Habit created!', description: 'Your team can now track this habit.' })
            onCreated()
            onClose()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return
        createMutation.mutate({ workspaceId, name, description })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Create Shared Habit
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Habit Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Daily standup"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description (optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What should team members do?"
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || !name.trim()}
                                className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

// Shared habit card
function SharedHabitCard({ habit, onToggle, isToggling }: {
    habit: { id: string; name: string; description?: string | null; completions: { userId: string }[] };
    onToggle: (id: string) => void;
    isToggling: boolean;
}) {
    const isCompleted = habit.completions.length > 0

    return (
        <Card className={`transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}`}>
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{habit.name}</h4>
                        {habit.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{habit.description}</p>
                        )}
                    </div>
                    <Button
                        variant={isCompleted ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onToggle(habit.id)}
                        disabled={isToggling}
                        className={isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        {isCompleted ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Done
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-1" />
                                Complete
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export default function WorkspaceDetailPage() {
    const router = useRouter()
    const params = useParams()
    const workspaceId = params.id as string
    const { toast } = useToast()

    const [showInviteModal, setShowInviteModal] = useState(false)
    const [showCreateHabitModal, setShowCreateHabitModal] = useState(false)

    const { data: workspace, isLoading, refetch } = api.workspace.getById.useQuery(
        { id: workspaceId },
        { enabled: !!workspaceId }
    )

    const { data: habits, refetch: refetchHabits } = api.sharedHabit.getByWorkspace.useQuery(
        { workspaceId },
        { enabled: !!workspaceId }
    )

    const { data: stats } = api.sharedHabit.getStats.useQuery(
        { workspaceId },
        { enabled: !!workspaceId }
    )

    const toggleMutation = api.sharedHabit.toggle.useMutation({
        onSuccess: () => {
            refetchHabits()
        },
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        }
    })

    const canManage = workspace?.currentUserRole === 'owner' || workspace?.currentUserRole === 'admin'

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="max-w-6xl mx-auto">
                    <Skeleton className="h-8 w-64 mb-8" />
                    <Skeleton className="h-[200px] w-full mb-4" />
                    <Skeleton className="h-[300px] w-full" />
                </div>
            </div>
        )
    }

    if (!workspace) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        Workspace not found
                    </h1>
                    <Button onClick={() => router.push('/dashboard/workspace')}>
                        Back to Workspaces
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/dashboard/workspace')}
                                className="text-gray-600 dark:text-gray-400"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                {workspace.name}
                            </h1>
                            <RoleBadge role={workspace.currentUserRole} />
                        </div>
                        <div className="flex items-center gap-2">
                            {canManage && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Invite
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowCreateHabitModal(true)}
                                        className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Habit
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column - Habits */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats */}
                        {stats && (
                            <div className="grid grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {stats.totalHabits}
                                        </div>
                                        <div className="text-sm text-gray-500">Habits</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {stats.memberCount}
                                        </div>
                                        <div className="text-sm text-gray-500">Members</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4 text-center">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {stats.todayCompletionRate}%
                                        </div>
                                        <div className="text-sm text-gray-500">Today's Progress</div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Habits List */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Team Habits
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!habits || habits.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400">No habits yet</p>
                                        {canManage && (
                                            <Button
                                                variant="outline"
                                                className="mt-4"
                                                onClick={() => setShowCreateHabitModal(true)}
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Create First Habit
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {habits.map((habit) => (
                                            <SharedHabitCard
                                                key={habit.id}
                                                habit={habit}
                                                onToggle={(id) => toggleMutation.mutate({ habitId: id })}
                                                isToggling={toggleMutation.isPending}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Members */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Members ({workspace.members?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {workspace.members?.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                                                    {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {member.user.name || member.user.email}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{member.user.email}</p>
                                                </div>
                                            </div>
                                            <RoleBadge role={member.role} />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {workspace.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>About</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {workspace.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showInviteModal && (
                <InviteMemberModal
                    workspaceId={workspaceId}
                    onClose={() => setShowInviteModal(false)}
                    onInvited={() => refetch()}
                />
            )}

            {showCreateHabitModal && (
                <CreateHabitModal
                    workspaceId={workspaceId}
                    onClose={() => setShowCreateHabitModal(false)}
                    onCreated={() => refetchHabits()}
                />
            )}
        </div>
    )
}
