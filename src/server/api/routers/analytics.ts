import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, eachDayOfInterval } from 'date-fns'

export const analyticsRouter = createTRPCRouter({
    // Get mood statistics over time
    getMoodStats: protectedProcedure
        .input(z.object({
            days: z.number().min(7).max(365).default(30)
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const startDate = subDays(new Date(), input.days)

            const entries = await ctx.db.journalEntry.findMany({
                where: {
                    userId,
                    entryDate: { gte: startDate },
                    mood: { not: null }
                },
                select: {
                    entryDate: true,
                    mood: true
                },
                orderBy: { entryDate: 'asc' }
            })

            // Convert mood to numeric value for charting
            const moodValues: Record<string, number> = {
                'great': 5,
                'good': 4,
                'okay': 3,
                'bad': 2,
                'terrible': 1
            }

            return entries.map(entry => ({
                date: format(entry.entryDate, 'yyyy-MM-dd'),
                mood: entry.mood,
                value: moodValues[entry.mood || 'okay'] || 3
            }))
        }),

    // Get productivity heatmap data (activity per day)
    getProductivityHeatmap: protectedProcedure
        .input(z.object({
            months: z.number().min(1).max(12).default(3)
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const startDate = subDays(new Date(), input.months * 30)
            const endDate = new Date()

            // Get all days in range
            const days = eachDayOfInterval({ start: startDate, end: endDate })

            // Fetch data in parallel
            const [habitCompletions, taskCompletions, journalEntries] = await Promise.all([
                ctx.db.habitCompletion.findMany({
                    where: {
                        habit: { userId, isActive: true },
                        completionDate: { gte: startDate, lte: endDate },
                        status: 'completed'
                    },
                    select: { completionDate: true }
                }),
                ctx.db.task.findMany({
                    where: {
                        userId,
                        status: 'completed',
                        completedAt: { gte: startDate, lte: endDate }
                    },
                    select: { completedAt: true }
                }),
                ctx.db.journalEntry.findMany({
                    where: {
                        userId,
                        entryDate: { gte: startDate, lte: endDate }
                    },
                    select: { entryDate: true }
                })
            ])

            // Create a map of date -> activity count
            const activityMap: Record<string, { habits: number; tasks: number; journals: number }> = {}

            days.forEach(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                activityMap[dateStr] = { habits: 0, tasks: 0, journals: 0 }
            })

            habitCompletions.forEach(h => {
                const dateStr = format(h.completionDate, 'yyyy-MM-dd')
                if (activityMap[dateStr]) activityMap[dateStr].habits++
            })

            taskCompletions.forEach(t => {
                if (t.completedAt) {
                    const dateStr = format(t.completedAt, 'yyyy-MM-dd')
                    if (activityMap[dateStr]) activityMap[dateStr].tasks++
                }
            })

            journalEntries.forEach(j => {
                const dateStr = format(j.entryDate, 'yyyy-MM-dd')
                if (activityMap[dateStr]) activityMap[dateStr].journals++
            })

            // Calculate activity score (weighted sum)
            return Object.entries(activityMap).map(([date, counts]) => ({
                date,
                ...counts,
                score: counts.habits * 2 + counts.tasks * 1 + counts.journals * 3
            }))
        }),

    // Get weekly summary stats
    getWeeklySummary: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const now = new Date()
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

        const [
            habitsCompleted,
            totalHabits,
            tasksCompleted,
            tasksCreated,
            journalEntries
        ] = await Promise.all([
            ctx.db.habitCompletion.count({
                where: {
                    habit: { userId, isActive: true },
                    completionDate: { gte: weekStart, lte: weekEnd },
                    status: 'completed'
                }
            }),
            ctx.db.habit.count({
                where: { userId, isActive: true }
            }),
            ctx.db.task.count({
                where: {
                    userId,
                    status: 'completed',
                    completedAt: { gte: weekStart, lte: weekEnd }
                }
            }),
            ctx.db.task.count({
                where: {
                    userId,
                    createdAt: { gte: weekStart, lte: weekEnd }
                }
            }),
            ctx.db.journalEntry.count({
                where: {
                    userId,
                    entryDate: { gte: weekStart, lte: weekEnd }
                }
            })
        ])

        // Calculate days in week so far
        const daysInWeek = Math.ceil((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
        const expectedHabitCompletions = totalHabits * daysInWeek
        const habitCompletionRate = expectedHabitCompletions > 0
            ? Math.round((habitsCompleted / expectedHabitCompletions) * 100)
            : 0

        return {
            weekStart: format(weekStart, 'MMM d'),
            weekEnd: format(weekEnd, 'MMM d'),
            habitsCompleted,
            expectedHabitCompletions,
            habitCompletionRate,
            tasksCompleted,
            tasksCreated,
            journalEntries,
            daysInWeek
        }
    }),

    // Get monthly summary with trend comparison
    getMonthlySummary: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const now = new Date()

        const thisMonthStart = startOfMonth(now)
        const thisMonthEnd = endOfMonth(now)
        const lastMonthStart = startOfMonth(subDays(thisMonthStart, 1))
        const lastMonthEnd = endOfMonth(subDays(thisMonthStart, 1))

        const [thisMonth, lastMonth] = await Promise.all([
            getMonthStats(ctx.db, userId, thisMonthStart, thisMonthEnd),
            getMonthStats(ctx.db, userId, lastMonthStart, lastMonthEnd)
        ])

        // Calculate trends (percentage change)
        const calculateTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / previous) * 100)
        }

        return {
            monthName: format(now, 'MMMM yyyy'),
            current: thisMonth,
            previous: lastMonth,
            trends: {
                habits: calculateTrend(thisMonth.habitsCompleted, lastMonth.habitsCompleted),
                tasks: calculateTrend(thisMonth.tasksCompleted, lastMonth.tasksCompleted),
                journals: calculateTrend(thisMonth.journalEntries, lastMonth.journalEntries)
            }
        }
    }),

    // Get overall dashboard stats
    getOverallStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const [
            totalHabits,
            totalCompletions,
            totalTasks,
            completedTasks,
            totalJournals,
            longestStreak
        ] = await Promise.all([
            ctx.db.habit.count({ where: { userId, isActive: true } }),
            ctx.db.habitCompletion.count({
                where: {
                    habit: { userId },
                    status: 'completed'
                }
            }),
            ctx.db.task.count({ where: { userId } }),
            ctx.db.task.count({ where: { userId, status: 'completed' } }),
            ctx.db.journalEntry.count({ where: { userId } }),
            calculateLongestStreak(ctx.db, userId)
        ])

        return {
            totalHabits,
            totalCompletions,
            totalTasks,
            completedTasks,
            taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            totalJournals,
            longestStreak
        }
    }),

    // Export data
    exportData: protectedProcedure
        .input(z.object({
            format: z.enum(['json', 'csv']),
            type: z.enum(['habits', 'tasks', 'journals', 'all'])
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const data: any = {}

            if (input.type === 'habits' || input.type === 'all') {
                data.habits = await ctx.db.habit.findMany({
                    where: { userId },
                    include: { completions: true }
                })
            }

            if (input.type === 'tasks' || input.type === 'all') {
                data.tasks = await ctx.db.task.findMany({
                    where: { userId }
                })
            }

            if (input.type === 'journals' || input.type === 'all') {
                data.journals = await ctx.db.journalEntry.findMany({
                    where: { userId },
                    include: { sections: true }
                })
            }

            if (input.format === 'json') {
                return { data: JSON.stringify(data, null, 2), contentType: 'application/json' }
            }

            // CSV format - flatten and convert
            const csvData = convertToCSV(data, input.type)
            return { data: csvData, contentType: 'text/csv' }
        })
})

// Helper function to get month stats
async function getMonthStats(db: any, userId: string, monthStart: Date, monthEnd: Date) {
    const [habitsCompleted, tasksCompleted, journalEntries] = await Promise.all([
        db.habitCompletion.count({
            where: {
                habit: { userId, isActive: true },
                completionDate: { gte: monthStart, lte: monthEnd },
                status: 'completed'
            }
        }),
        db.task.count({
            where: {
                userId,
                status: 'completed',
                completedAt: { gte: monthStart, lte: monthEnd }
            }
        }),
        db.journalEntry.count({
            where: {
                userId,
                entryDate: { gte: monthStart, lte: monthEnd }
            }
        })
    ])

    return { habitsCompleted, tasksCompleted, journalEntries }
}

// Helper function to calculate longest streak
async function calculateLongestStreak(db: any, userId: string): Promise<number> {
    const completions = await db.habitCompletion.findMany({
        where: {
            habit: { userId, isActive: true },
            status: 'completed'
        },
        select: { completionDate: true },
        orderBy: { completionDate: 'asc' }
    })

    if (completions.length === 0) return 0

    const dates = [...new Set(completions.map((c: any) =>
        format(c.completionDate, 'yyyy-MM-dd')
    ))].sort()

    let longestStreak = 1
    let currentStreak = 1

    for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1] as string)
        const currDate = new Date(dates[i] as string)
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
            currentStreak++
            longestStreak = Math.max(longestStreak, currentStreak)
        } else {
            currentStreak = 1
        }
    }

    return longestStreak
}

// Helper function to convert data to CSV
function convertToCSV(data: any, type: string): string {
    let csv = ''

    if (type === 'habits' || type === 'all') {
        csv += 'HABITS\n'
        csv += 'Name,Category,Frequency,Created,Total Completions\n'
        data.habits?.forEach((h: any) => {
            csv += `"${h.name}","${h.category || ''}","${h.frequency}","${format(h.createdAt, 'yyyy-MM-dd')}",${h.completions?.length || 0}\n`
        })
        csv += '\n'
    }

    if (type === 'tasks' || type === 'all') {
        csv += 'TASKS\n'
        csv += 'Title,Priority,Status,Due Date,Completed At\n'
        data.tasks?.forEach((t: any) => {
            csv += `"${t.title}","${t.priority}","${t.status}","${t.dueDate ? format(t.dueDate, 'yyyy-MM-dd') : ''}","${t.completedAt ? format(t.completedAt, 'yyyy-MM-dd') : ''}"\n`
        })
        csv += '\n'
    }

    if (type === 'journals' || type === 'all') {
        csv += 'JOURNAL ENTRIES\n'
        csv += 'Date,Mood,Content Length\n'
        data.journals?.forEach((j: any) => {
            csv += `"${format(j.entryDate, 'yyyy-MM-dd')}","${j.mood || ''}",${j.mainContent?.length || 0}\n`
        })
    }

    return csv
}
