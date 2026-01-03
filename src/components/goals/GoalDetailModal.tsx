'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Check, Plus, Trash2, Circle, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

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

interface GoalDetailModalProps {
    goal: Goal
    open: boolean
    onOpenChange: (open: boolean) => void
}

const statusColors: Record<string, string> = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export function GoalDetailModal({ goal, open, onOpenChange }: GoalDetailModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()
    const [newMilestone, setNewMilestone] = useState('')

    const toggleMilestone = api.goal.toggleMilestone.useMutation({
        onSuccess: () => {
            void utils.goal.getAll.invalidate()
            void utils.goal.getActive.invalidate()
            void utils.goal.getById.invalidate()
            void utils.goal.getStats.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            })
        },
    })

    const addMilestone = api.goal.addMilestone.useMutation({
        onSuccess: () => {
            setNewMilestone('')
            void utils.goal.getAll.invalidate()
            void utils.goal.getActive.invalidate()
            void utils.goal.getById.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            })
        },
    })

    const deleteMilestone = api.goal.deleteMilestone.useMutation({
        onSuccess: () => {
            void utils.goal.getAll.invalidate()
            void utils.goal.getActive.invalidate()
            void utils.goal.getById.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            })
        },
    })

    const updateGoal = api.goal.update.useMutation({
        onSuccess: () => {
            toast({ title: 'Goal updated!' })
            void utils.goal.getAll.invalidate()
            void utils.goal.getActive.invalidate()
            void utils.goal.getStats.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            })
        },
    })

    const handleAddMilestone = () => {
        if (newMilestone.trim()) {
            addMilestone.mutate({
                goalId: goal.id,
                title: newMilestone.trim(),
            })
        }
    }

    const handleStatusChange = (status: 'active' | 'completed' | 'archived') => {
        updateGoal.mutate({ id: goal.id, status })
    }

    const completedCount = goal.milestones.filter(m => m.isCompleted).length
    const progressPercent = Math.round(goal.progress)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: goal.color || '#3B82F6' }}
                        />
                        <DialogTitle className="text-xl">{goal.title}</DialogTitle>
                    </div>
                    {goal.description && (
                        <DialogDescription className="mt-2">
                            {goal.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Meta */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <Badge className={statusColors[goal.status]}>
                            {goal.status}
                        </Badge>
                        {goal.category && (
                            <Badge variant="outline">{goal.category}</Badge>
                        )}
                        {goal.targetDate && (
                            <Badge variant="secondary">
                                Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                            </Badge>
                        )}
                    </div>

                    {/* Progress */}
                    <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-medium">Overall Progress</span>
                            <span className="text-gray-600 dark:text-gray-400">
                                {completedCount}/{goal.milestones.length} milestones • {progressPercent}%
                            </span>
                        </div>
                        <Progress value={progressPercent} className="h-3" />
                    </div>

                    {/* Milestones */}
                    <div>
                        <h4 className="font-medium mb-3">Milestones</h4>

                        {/* Add new milestone */}
                        <div className="flex gap-2 mb-4">
                            <Input
                                value={newMilestone}
                                onChange={(e) => setNewMilestone(e.target.value)}
                                placeholder="Add a new milestone"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddMilestone()
                                    }
                                }}
                            />
                            <Button
                                variant="outline"
                                onClick={handleAddMilestone}
                                disabled={addMilestone.isPending || !newMilestone.trim()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Milestone list */}
                        {goal.milestones.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No milestones yet. Add one to track your progress!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {goal.milestones.map((milestone) => (
                                    <div
                                        key={milestone.id}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-lg border
                                            ${milestone.isCompleted
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                            }
                                        `}
                                    >
                                        <button
                                            onClick={() => toggleMilestone.mutate({ id: milestone.id })}
                                            disabled={toggleMilestone.isPending}
                                            className="flex-shrink-0"
                                        >
                                            {milestone.isCompleted ? (
                                                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <Circle className="h-6 w-6 text-gray-400 hover:text-blue-500 transition-colors" />
                                            )}
                                        </button>
                                        <span
                                            className={`flex-1 ${milestone.isCompleted
                                                    ? 'line-through text-gray-500 dark:text-gray-400'
                                                    : 'text-gray-900 dark:text-white'
                                                }`}
                                        >
                                            {milestone.title}
                                        </span>
                                        <button
                                            onClick={() => deleteMilestone.mutate({ id: milestone.id })}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        {goal.status === 'active' && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleStatusChange('completed')}
                                    disabled={updateGoal.isPending}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Mark Complete
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleStatusChange('archived')}
                                    disabled={updateGoal.isPending}
                                >
                                    Archive
                                </Button>
                            </>
                        )}
                        {goal.status === 'completed' && (
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange('active')}
                                disabled={updateGoal.isPending}
                            >
                                Reopen Goal
                            </Button>
                        )}
                        {goal.status === 'archived' && (
                            <Button
                                variant="outline"
                                onClick={() => handleStatusChange('active')}
                                disabled={updateGoal.isPending}
                            >
                                Restore Goal
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
