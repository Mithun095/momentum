'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Edit, Trash2, Target, Calendar, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

interface Milestone {
    id: string
    title: string
    isCompleted: boolean
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

interface GoalCardProps {
    goal: Goal
    onEdit: (goal: Goal) => void
    onDelete: (id: string) => void
    onClick: (goal: Goal) => void
}

const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

const categoryColors: Record<string, string> = {
    career: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    health: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    finance: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    education: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    personal: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    relationships: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    creative: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export function GoalCard({ goal, onEdit, onDelete, onClick }: GoalCardProps) {
    const completedMilestones = goal.milestones.filter(m => m.isCompleted).length
    const totalMilestones = goal.milestones.length
    const progressPercent = Math.round(goal.progress)

    return (
        <Card
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            style={{ borderTop: `4px solid ${goal.color || '#3B82F6'}` }}
            onClick={() => onClick(goal)}
        >
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <Target
                            className="h-5 w-5"
                            style={{ color: goal.color || '#3B82F6' }}
                        />
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit(goal)
                            }}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(goal.id)
                            }}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                </div>
                {goal.description && (
                    <CardDescription className="line-clamp-2 mt-1">
                        {goal.description}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className={statusColors[goal.status] || statusColors.active}>
                        {goal.status}
                    </Badge>
                    {goal.category && (
                        <Badge className={categoryColors[goal.category] || categoryColors.other}>
                            {goal.category}
                        </Badge>
                    )}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {progressPercent}%
                        </span>
                    </div>
                    <Progress
                        value={progressPercent}
                        className="h-2"
                    />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                            {completedMilestones}/{totalMilestones} milestones
                        </span>
                    </div>
                    {goal.targetDate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
