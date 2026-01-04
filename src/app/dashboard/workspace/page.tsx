'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { Plus, Users, Target, Building2, Crown, Shield, User, Settings, ArrowLeft } from 'lucide-react'
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

// Create workspace modal
function CreateWorkspaceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<'team' | 'hr' | 'company'>('team')
    const { toast } = useToast()

    const createMutation = api.workspace.create.useMutation({
        onSuccess: () => {
            toast({ title: 'Workspace created!', description: 'Your new workspace is ready.' })
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
        createMutation.mutate({ name, description, type })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Create Workspace
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My Team"
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
                                placeholder="What is this workspace for?"
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as 'team' | 'hr' | 'company')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
                            >
                                <option value="team">Team</option>
                                <option value="hr">HR</option>
                                <option value="company">Company</option>
                            </select>
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

export default function WorkspacesPage() {
    const router = useRouter()
    const [showCreateModal, setShowCreateModal] = useState(false)

    const { data: workspaces, isLoading, refetch } = api.workspace.getAll.useQuery()

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Workspaces
                            </h1>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            New Workspace
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-48 mb-4" />
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !workspaces || workspaces.length === 0 ? (
                    <Card className="py-16">
                        <CardContent className="text-center">
                            <Building2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4 mx-auto" />
                            <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                No workspaces yet
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Create a workspace to collaborate with your team on shared habits
                            </p>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Workspace
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {workspaces.map((workspace) => (
                            <Card
                                key={workspace.id}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => router.push(`/dashboard/workspace/${workspace.id}`)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-gray-500" />
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {workspace.name}
                                            </h3>
                                        </div>
                                        <RoleBadge role={workspace.role} />
                                    </div>

                                    {workspace.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                            {workspace.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Target className="h-4 w-4" />
                                            {workspace.habitCount} habit{workspace.habitCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateWorkspaceModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => refetch()}
                />
            )}
        </div>
    )
}
