'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Check, X, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'
import { getCategoryInfo } from '@/lib/constants/habitCategories'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'

interface TodayHabitsProps {
    className?: string
}

export function TodayHabits({ className }: TodayHabitsProps) {
    const { toast } = useToast()
    const { data: habits, isLoading } = api.habit.getAll.useQuery()

    // Get completions for the last 30 days
    // Use useMemo to prevent unstable query keys (dates changing every render)
    const { startDate, endDate } = useMemo(() => {
        const end = new Date()
        end.setHours(23, 59, 59, 999)

        const start = new Date()
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)

        return { startDate: start, endDate: end }
    }, [])

    const { data: completions } = api.habit.getAllCompletions.useQuery(
        {
            startDate,
            endDate,
        },
        {
            enabled: !!habits && habits.length > 0,
            refetchOnWindowFocus: false
        }
    )
    const utils = api.useUtils()

    const markComplete = api.habit.markComplete.useMutation({
        onSuccess: (_data, variables) => {
            console.log('Mutation successful for habit:', variables.habitId)
            toast({
                title: 'Habit completed!',
                description: 'Great job! Keep up the streak! 🔥',
            })
            // Void the promise to fix floating promise lint
            void utils.habit.getAll.invalidate()
            void utils.habit.getAllCompletions.invalidate()
        },
        onError: (error) => {
            console.error('Mutation failed:', error)
            toast({
                title: 'Error',
                description: error.message || 'Failed to mark habit',
                variant: 'destructive',
            })
        },
    })

    const handleMarkStatus = (habitId: string, status: 'completed' | 'skipped' | 'failed') => {
        console.log('Marking status:', habitId, status)
        markComplete.mutate({
            habitId,
            date: new Date(), // This captures local time
            status,
        })
    }

    // Calculate today's completions
    const todayCompletions = useMemo(() => {
        if (!completions || !habits) {
            console.log('No completions or habits loaded')
            return { completed: [], count: 0 }
        }

        // Get today in YYYY-MM-DD format based on local time
        const today = format(new Date(), 'yyyy-MM-dd')

        console.log('Comparing completions against today:', today)
        console.log('Raw completions:', completions)

        const todayCompleted = completions.filter((c) => {
            // Ensure we're comparing date parts only
            const completionDate = format(new Date(c.completionDate), 'yyyy-MM-dd')
            const isMatch = completionDate === today && c.status === 'completed'
            if (isMatch) console.log('Found match for:', c.habitId)
            return isMatch
        })

        return {
            completed: todayCompleted.map(c => c.habitId),
            count: todayCompleted.length
        }
    }, [completions, habits])

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!habits || habits.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Today's Habits</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">
                        No habits yet. Create your first habit to get started!
                    </div>
                </CardContent>
            </Card>
        )
    }

    const completedCount = todayCompletions.count
    const totalCount = habits.length
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Today's Habits</CardTitle>
                    <Badge variant="secondary">
                        {completedCount} / {totalCount}
                    </Badge>
                </div>
                <Progress value={completionRate} className="mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {habits.slice(0, 5).map((habit) => {
                        const category = getCategoryInfo(habit.category || 'other')
                        const isCompleted = todayCompletions.completed.includes(habit.id)

                        return (
                            <div
                                key={habit.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{habit.icon || category.icon}</span>
                                    <div>
                                        <p className={cn("font-medium text-sm", isCompleted && "line-through text-gray-500")}>
                                            {habit.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{category.label}</p>
                                    </div>
                                    {isCompleted && (
                                        <Badge variant="default" className="ml-2 bg-green-500">
                                            ✓ Done
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMarkStatus(habit.id, 'completed')}
                                        className="hover:bg-green-100 dark:hover:bg-green-900/20"
                                        disabled={markComplete.isPending || isCompleted}
                                    >
                                        <Check className="h-4 w-4 text-green-600" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMarkStatus(habit.id, 'skipped')}
                                        className="hover:bg-yellow-100 dark:hover:bg-yellow-900/20"
                                        disabled={markComplete.isPending || isCompleted}
                                    >
                                        <MinusCircle className="h-4 w-4 text-yellow-600" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMarkStatus(habit.id, 'failed')}
                                        className="hover:bg-red-100 dark:hover:bg-red-900/20"
                                        disabled={markComplete.isPending || isCompleted}
                                    >
                                        <X className="h-4 w-4 text-red-600" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {habits.length > 5 && (
                    <Button variant="link" className="w-full mt-4" asChild>
                        <a href="/dashboard/habits">View all {habits.length} habits →</a>
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}
