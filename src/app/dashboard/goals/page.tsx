'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Target, CheckCircle2, Archive, TrendingUp } from 'lucide-react'
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
        onError: (error) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        },
    })

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this goal?')) {
            deleteGoal.mutate({ id })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Goals
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Set goals and track your progress with milestones
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Goal
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.active || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Active Goals
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.completed || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Completed
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(stats?.avgProgress || 0)}%
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Avg Progress
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <Archive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {stats?.total || 0}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Total Goals
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['active', 'completed', 'archived', 'all'] as const).map((f) => (
                        <Button
                            key={f}
                            variant={filter === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Button>
                    ))}
                </div>

                {/* Goals Grid */}
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/2 mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-2 w-full mt-4" />
                                    <Skeleton className="h-4 w-1/3 mt-4" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !goals || goals.length === 0 ? (
                    <Card className="py-16">
                        <CardContent className="text-center">
                            <div className="text-6xl mb-4">🎯</div>
                            <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                                {filter === 'all' ? 'No goals yet' : `No ${filter} goals`}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Set a goal and break it down into achievable milestones!
                            </p>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Your First Goal
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {goals.map((goal: Goal) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onEdit={setSelectedGoal}
                                onDelete={handleDelete}
                                onClick={setSelectedGoal}
                            />
                        ))}
                    </div>
                )}
            </div>

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
    )
}
