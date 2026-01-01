'use client'

import { useState, useMemo } from 'react'
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

export function HabitList({ habits, isLoading }: HabitListProps) {
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
    const { toast } = useToast()
    const utils = api.useUtils()

    // Get date range for today (stable across renders)
    const { startDate, endDate } = useMemo(() => {
        const today = new Date()
        return {
            startDate: startOfDay(today),
            endDate: endOfDay(today),
        }
    }, [])

    // Fetch today's completions
    const { data: completions } = api.habit.getAllCompletions.useQuery(
        { startDate, endDate },
        { enabled: !!habits && habits.length > 0 }
    )

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
        onSuccess: () => {
            toast({
                title: 'Habit completed!',
                description: 'Great job! Keep up the streak! 🔥',
            })
            void utils.habit.getAll.invalidate()
            void utils.habit.getAllCompletions.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to mark habit as complete',
                variant: 'destructive',
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
                        <Card key={habit.id} className={`group hover:shadow-lg transition-shadow ${isCompleted ? 'opacity-75' : ''}`}>
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
                            </CardHeader>
                            <CardContent>
                                {isCompleted ? (
                                    <div className="w-full py-2 text-center text-green-600 dark:text-green-400 font-medium">
                                        ✅ Completed for Today
                                    </div>
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
}

