'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Check } from 'lucide-react'
import { getCategoryInfo } from '@/lib/constants/habitCategories'
import { getColorClasses } from '@/lib/constants/habitColors'
import { EditHabitModal } from './EditHabitModal'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { format, startOfDay, endOfDay } from 'date-fns'

interface Habit {
    id: string
    name: string
    description?: string | null
    category?: string | null
    color?: string | null
    icon?: string | null
    frequency: string
    isActive: boolean
    createdAt: Date
}

interface HabitListProps {
    habits?: Habit[]
    isLoading: boolean
}

export const HabitList = React.memo(function HabitList({ habits, isLoading }: HabitListProps) {
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
    const { toast } = useToast()
    const utils = api.useUtils()

    // Get date range for today (stable across renders)
    // Get date range for today
    const today = new Date()
    const startDate = startOfDay(today)
    const endDate = endOfDay(today)

    // Fetch today's completions
    const { data: completions } = api.habit.getAllCompletions.useQuery(
        { startDate, endDate },
        { enabled: !!habits && habits.length > 0 }
    )

    // Fetch stats
    const { data: stats } = api.habit.getStats.useQuery(undefined, {
        enabled: !!habits && habits.length > 0
    })

    // Map of habitId -> completed today
    const completedToday = useMemo(() => {
        if (!completions) return new Set<string>()
        const today = format(new Date(), 'yyyy-MM-dd')
        return new Set(
            completions
                .filter((c) => {
                    const completionDate = format(new Date(c.completionDate), 'yyyy-MM-dd')
                    return completionDate === today && c.status === 'completed'
                })
                .map((c) => c.habitId)
        )
    }, [completions])

    const markComplete = api.habit.markComplete.useMutation({
        onMutate: async (newHabit) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await utils.habit.getAllCompletions.cancel()
            await utils.habit.getStats.cancel()

            // Snapshot the previous value
            const previousCompletions = utils.habit.getAllCompletions.getData({ startDate, endDate })
            const previousStats = utils.habit.getStats.getData()

            // Optimistically update to the new value
            if (previousCompletions) {
                utils.habit.getAllCompletions.setData({ startDate, endDate }, (old) => {
                    if (!old) return []
                    return [
                        ...old,
                        {
                            id: 'temp-id-' + Math.random(),
                            habitId: newHabit.habitId,
                            completionDate: newHabit.date,
                            status: newHabit.status || 'completed',
                            notes: newHabit.notes || null,
                            createdAt: new Date(),
                        },
                    ]
                })
            }

            // Optimistically update stats
            if (previousStats && newHabit.status === 'completed') {
                utils.habit.getStats.setData(undefined, (old) => {
                    if (!old) return {}
                    const habitStats = old[newHabit.habitId] || { streak: 0, totalCompletions: 0 }
                    return {
                        ...old,
                        [newHabit.habitId]: {
                            streak: habitStats.streak + 1,
                            totalCompletions: habitStats.totalCompletions + 1,
                        },
                    }
                })
            }

            return { previousCompletions, previousStats }
        },
        onError: (err, newHabit, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousCompletions) {
                utils.habit.getAllCompletions.setData({ startDate, endDate }, context.previousCompletions)
            }
            if (context?.previousStats) {
                utils.habit.getStats.setData(undefined, context.previousStats)
            }
            toast({
                title: 'Error',
                description: err.message || 'Failed to mark habit as complete',
                variant: 'destructive',
            })
        },
        onSettled: () => {
            // Always refetch after error or success:
            void utils.habit.getAllCompletions.invalidate()
            void utils.habit.getStats.invalidate()
            void utils.habit.getAll.invalidate()
        },
        onSuccess: () => {
            toast({
                title: 'Habit completed!',
                description: 'Great job! Keep up the streak! 🔥',
            })
        },
    })

    const removeCompletion = api.habit.removeCompletion.useMutation({
        onMutate: async (variables: { habitId: string; date: Date }) => {
            await utils.habit.getAllCompletions.cancel()
            await utils.habit.getStats.cancel()

            const previousCompletions = utils.habit.getAllCompletions.getData({ startDate, endDate })
            const previousStats = utils.habit.getStats.getData()

            if (previousCompletions) {
                utils.habit.getAllCompletions.setData({ startDate, endDate }, (old) => {
                    if (!old) return []
                    return old.filter(
                        (c) =>
                            !(
                                c.habitId === variables.habitId &&
                                format(new Date(c.completionDate), 'yyyy-MM-dd') ===
                                format(new Date(variables.date), 'yyyy-MM-dd')
                            )
                    )
                })
            }

            if (previousStats) {
                utils.habit.getStats.setData(undefined, (old) => {
                    if (!old) return {}
                    const habitStats = old[variables.habitId]
                    if (!habitStats) return old

                    return {
                        ...old,
                        [variables.habitId]: {
                            streak: Math.max(0, habitStats.streak - 1),
                            totalCompletions: Math.max(0, habitStats.totalCompletions - 1),
                        },
                    }
                })
            }

            return { previousCompletions, previousStats }
        },
        onError: (err: any, variables: { habitId: string; date: Date }, context: any) => {
            if (context?.previousCompletions) {
                utils.habit.getAllCompletions.setData({ startDate, endDate }, context.previousCompletions)
            }
            if (context?.previousStats) {
                utils.habit.getStats.setData(undefined, context.previousStats)
            }
            toast({
                title: 'Error',
                description: 'Failed to undo completion',
                variant: 'destructive',
            })
        },
        onSettled: () => {
            void utils.habit.getAllCompletions.invalidate()
            void utils.habit.getStats.invalidate()
            void utils.habit.getAll.invalidate()
        },
        onSuccess: () => {
            toast({
                title: 'Undone',
                description: 'Habit completion removed',
            })
        },
    })

    const handleQuickComplete = (habitId: string) => {
        markComplete.mutate({
            habitId,
            date: new Date(),
            status: 'completed',
        })
    }

    const handleUndoComplete = (habitId: string) => {
        removeCompletion.mutate({
            habitId,
            date: new Date(),
        })
    }

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    if (!habits || habits.length === 0) {
        return (
            <Card className="py-16">
                <CardContent className="text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                        No habits yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Start building better habits by creating your first one!
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {habits.map((habit) => {
                    const category = getCategoryInfo(habit.category || 'other')
                    const colorClasses = getColorClasses(habit.color || 'blue')
                    const isCompleted = completedToday.has(habit.id)

                    return (
                        <Card key={habit.id} className={`group hover:shadow-lg transition-all duration-200 ${isCompleted ? 'opacity-75' : ''}`}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{habit.icon || category.icon}</span>
                                        <div>
                                            <CardTitle className={`text-lg ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                                                {habit.name}
                                            </CardTitle>
                                            {habit.description && (
                                                <CardDescription className="mt-1">
                                                    {habit.description}
                                                </CardDescription>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingHabit(habit)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <Badge variant="secondary">
                                        <span className={category.color}>{category.label}</span>
                                    </Badge>
                                    <Badge variant="outline" className={colorClasses.border}>
                                        <span className={colorClasses.text}>{habit.frequency}</span>
                                    </Badge>
                                    {isCompleted && (
                                        <Badge className="bg-green-500 text-white">
                                            ✓ Done
                                        </Badge>
                                    )}
                                </div>
                                {/* Stats Display */}
                                <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <span>🔥 Streak:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">
                                            {stats?.[habit.id]?.streak || 0}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>Total:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">
                                            {stats?.[habit.id]?.totalCompletions || 0}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isCompleted ? (
                                    <Button
                                        variant="ghost"
                                        className="w-full py-2 text-center text-green-600 dark:text-green-400 font-medium hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                                        onClick={() => handleUndoComplete(habit.id)}
                                        disabled={removeCompletion.isPending}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span>✅ Completed</span>
                                            <span className="text-xs opacity-0 group-hover/btn:opacity-100">(Click to Undo)</span>
                                        </div>
                                    </Button>
                                ) : (
                                    <Button
                                        className="w-full bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                                        onClick={() => handleQuickComplete(habit.id)}
                                        disabled={markComplete.isPending}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Complete for Today
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {editingHabit && (
                <EditHabitModal
                    habit={editingHabit}
                    open={!!editingHabit}
                    onOpenChange={(open) => !open && setEditingHabit(null)}
                />
            )}
        </>
    )
})

