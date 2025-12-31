import { differenceInDays, startOfDay, isToday } from 'date-fns'

interface HabitCompletion {
    completionDate: Date
    status: string
}

/**
 * Calculate the current streak for a habit based on completion records
 * A streak is broken if a day is missed (no completion or status is not 'completed')
 */
export function calculateStreak(completions: HabitCompletion[]): number {
    if (!completions || completions.length === 0) return 0

    // Sort completions by date in descending order (most recent first)
    const sortedCompletions = [...completions]
        .filter((c) => c.status === 'completed')
        .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime())

    if (sortedCompletions.length === 0) return 0

    const today = startOfDay(new Date())
    const mostRecent = startOfDay(new Date(sortedCompletions[0].completionDate))

    // If most recent completion is not today or yesterday, streak is broken
    const daysSinceLast = differenceInDays(today, mostRecent)
    if (daysSinceLast > 1) return 0

    // Count consecutive days
    let streak = 0
    let expectedDate = today

    // If today is not completed yet, start from yesterday
    if (!isToday(mostRecent)) {
        expectedDate = startOfDay(new Date(today.getTime() - 24 * 60 * 60 * 1000))
    }

    for (const completion of sortedCompletions) {
        const completionDate = startOfDay(new Date(completion.completionDate))
        const diff = differenceInDays(expectedDate, completionDate)

        if (diff === 0) {
            streak++
            // Move to previous day
            expectedDate = startOfDay(new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000))
        } else if (diff > 0) {
            // Gap in completions, streak is broken
            break
        }
    }

    return streak
}

/**
 * Calculate the longest streak from all completion records
 */
export function calculateLongestStreak(completions: HabitCompletion[]): number {
    if (!completions || completions.length === 0) return 0

    const sortedCompletions = [...completions]
        .filter((c) => c.status === 'completed')
        .sort((a, b) => new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime())

    if (sortedCompletions.length === 0) return 0

    let longestStreak = 0
    let currentStreak = 1
    let previousDate = startOfDay(new Date(sortedCompletions[0].completionDate))

    for (let i = 1; i < sortedCompletions.length; i++) {
        const currentDate = startOfDay(new Date(sortedCompletions[i].completionDate))
        const daysBetween = differenceInDays(currentDate, previousDate)

        if (daysBetween === 1) {
            // Consecutive day
            currentStreak++
        } else {
            // Gap found, save current streak if it's the longest
            longestStreak = Math.max(longestStreak, currentStreak)
            currentStreak = 1
        }

        previousDate = currentDate
    }

    // Check final streak
    longestStreak = Math.max(longestStreak, currentStreak)

    return longestStreak
}

/**
 * Calculate completion rate for a given period
 */
export function calculateCompletionRate(
    completions: HabitCompletion[],
    totalDays: number
): number {
    if (totalDays === 0) return 0

    const completedCount = completions.filter((c) => c.status === 'completed').length
    return Math.round((completedCount / totalDays) * 100)
}

/**
 * Get streak status message
 */
export function getStreakMessage(streak: number): string {
    if (streak === 0) return 'Start your streak today!'
    if (streak === 1) return '1 day streak!'
    if (streak < 7) return `${streak} day streak! Keep going!`
    if (streak < 30) return `${streak} day streak! 🔥 Amazing!`
    if (streak < 100) return `${streak} day streak! 🔥🔥 Incredible!`
    return `${streak} day streak! 🔥🔥🔥 Legendary!`
}
