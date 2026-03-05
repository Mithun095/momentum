'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calculateStreak, calculateLongestStreak, getStreakMessage } from '@/lib/utils/streak'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HabitCompletion {
    completionDate: Date
    status: string
}

interface StreakDisplayProps {
    completions: HabitCompletion[]
    className?: string
    size?: 'sm' | 'md' | 'lg'
}

export function StreakDisplay({ completions, className, size = 'md' }: StreakDisplayProps) {
    const currentStreak = calculateStreak(completions)
    const longestStreak = calculateLongestStreak(completions)
    const message = getStreakMessage(currentStreak)

    const getStreakColor = (streak: number) => {
        if (streak === 0) return 'text-gray-400'
        if (streak < 7) return 'text-orange-500'
        if (streak < 30) return 'text-orange-600'
        if (streak < 100) return 'text-red-500'
        return 'text-red-600'
    }

    const sizeClasses = {
        sm: {
            icon: 'h-8 w-8',
            number: 'text-3xl',
            text: 'text-xs',
        },
        md: {
            icon: 'h-12 w-12',
            number: 'text-5xl',
            text: 'text-sm',
        },
        lg: {
            icon: 'h-16 w-16',
            number: 'text-7xl',
            text: 'text-base',
        },
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Flame className={cn(sizeClasses[size].icon, getStreakColor(currentStreak))} />
                    Current Streak
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Current Streak */}
                <div className="text-center">
                    <div className={cn('font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent', sizeClasses[size].number)}>
                        {currentStreak}
                    </div>
                    <p className={cn('text-gray-600 dark:text-gray-400 mt-1', sizeClasses[size].text)}>
                        {currentStreak === 1 ? 'day' : 'days'}
                    </p>
                    <p className={cn('text-gray-500 dark:text-gray-500 mt-2', sizeClasses[size].text)}>
                        {message}
                    </p>
                </div>

                {/* Longest Streak */}
                {longestStreak > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</span>
                        <Badge variant="secondary" className="text-lg font-semibold">
                            {longestStreak} {longestStreak === 1 ? 'day' : 'days'}
                        </Badge>
                    </div>
                )}

                {/* Milestone Progress */}
                {currentStreak > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span>Next Milestone</span>
                            <span>
                                {currentStreak} / {currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : 365}
                            </span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-300"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        (currentStreak / (currentStreak < 7 ? 7 : currentStreak < 30 ? 30 : currentStreak < 100 ? 100 : 365)) * 100
                                    )}%`,
                                }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
