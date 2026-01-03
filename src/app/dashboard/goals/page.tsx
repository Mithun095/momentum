'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Target, CheckCircle2, Archive, TrendingUp, ChevronLeft } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { GoalCard } from '@/components/goals/GoalCard'
import { CreateGoalModal } from '@/components/goals/CreateGoalModal'
import { GoalDetailModal } from '@/components/goals/GoalDetailModal'

interface Milestone {
    id: string
    title: string
    isCompleted: boolean
    completedAt?: Date | null
}

interface Goal {
    id: string
    title: string
    description?: string | null
    category?: string | null
    targetDate?: Date | null
    status: string
    progress: number
    color?: string | null
    milestones: Milestone[]
}

export default function GoalsPage() {
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
    const [filter, setFilter] = useState<'active' | 'completed' | 'archived' | 'all'>('active')
    const { toast } = useToast()
    const utils = api.useUtils()

    const { data: goals, isLoading } = api.goal.getAll.useQuery(
        filter === 'all' ? undefined : { status: filter }
    )
    const { data: stats } = api.goal.getStats.useQuery()

    const deleteGoal = api.goal.delete.useMutation({
        onSuccess: () => {
            toast({ title: 'Goal deleted', description: 'The goal has been removed.' })
            void utils.goal.getAll.invalidate()
            void utils.goal.getStats.invalidate()
        },
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-4 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Navigation */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Track your progress towards meaningful objectives
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Goal
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.active ?? 0}</p>
                                    <p className="text-sm text-gray-500">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.completed ?? 0}</p>
                                    <p className="text-sm text-gray-500">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <Archive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.archived ?? 0}</p>
                                    <p className="text-sm text-gray-500">Archived</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats?.avgProgress ?? 0}%</p>
                                    <p className="text-sm text-gray-500">Avg Progress</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {(['active', 'completed', 'archived', 'all'] as const).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                            className="capitalize"
                        >
                            {f}
                        </Button>
                    ))}
                </div>

                {/* Goals Grid */}
                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-48 rounded-xl" />
                        ))}
                    </div>
                ) : goals && goals.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map((goal: Goal) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onClick={() => setSelectedGoal(goal)}
                                onEdit={() => setSelectedGoal(goal)}
                                onDelete={() => deleteGoal.mutate({ id: goal.id })}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No goals yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Create your first goal to start tracking your progress
                        </p>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Goal
                        </Button>
                    </Card>
                )}

                {/* Modals */}
                <CreateGoalModal
                    open={showCreateModal}
                    onOpenChange={setShowCreateModal}
                />

                {selectedGoal && (
                    <GoalDetailModal
                        goal={selectedGoal}
                        open={!!selectedGoal}
                        onOpenChange={(open) => !open && setSelectedGoal(null)}
                    />
                )}
            </div>
        </div>
    )
}
