import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const habitRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        return await ctx.db.habit.findMany({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
        })
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                description: z.string().optional(),
                category: z.string().optional(),
                frequency: z.enum(['daily', 'weekly', 'custom']).default('daily'),
                color: z.string().optional(),
                icon: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            return await ctx.db.habit.create({
                data: {
                    ...input,
                    userId,
                },
            })
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1).max(100).optional(),
                description: z.string().optional(),
                isActive: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { id, ...data } = input

            // Verify ownership
            const habit = await ctx.db.habit.findFirst({
                where: { id, userId },
            })
            if (!habit) {
                throw new Error('Habit not found')
            }

            return await ctx.db.habit.update({
                where: { id },
                data,
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership
            const habit = await ctx.db.habit.findFirst({
                where: { id: input.id, userId },
            })
            if (!habit) {
                throw new Error('Habit not found')
            }

            return await ctx.db.habit.update({
                where: { id: input.id },
                data: { isActive: false },
            })
        }),

    markComplete: protectedProcedure
        .input(
            z.object({
                habitId: z.string(),
                date: z.date(),
                status: z.enum(['completed', 'skipped', 'failed']).default('completed'),
                notes: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify the user owns this habit
            const habit = await ctx.db.habit.findFirst({
                where: { id: input.habitId, userId },
            })
            if (!habit) {
                throw new Error('Habit not found')
            }

            return await ctx.db.habitCompletion.upsert({
                where: {
                    habitId_completionDate: {
                        habitId: input.habitId,
                        completionDate: input.date,
                    },
                },
                update: {
                    status: input.status,
                    notes: input.notes,
                },
                create: {
                    habitId: input.habitId,
                    completionDate: input.date,
                    status: input.status,
                    notes: input.notes,
                },
            })
        }),

    getCompletions: protectedProcedure
        .input(
            z.object({
                habitId: z.string(),
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            return await ctx.db.habitCompletion.findMany({
                where: {
                    habitId: input.habitId,
                    completionDate: {
                        gte: input.startDate,
                        lte: input.endDate,
                    },
                },
                orderBy: { completionDate: 'asc' },
            })
        }),

    // Get ALL completions for user's habits in a date range
    getAllCompletions: protectedProcedure
        .input(
            z.object({
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Get all user's habit IDs
            const userHabits = await ctx.db.habit.findMany({
                where: { userId, isActive: true },
                select: { id: true },
            })

            const habitIds = userHabits.map(h => h.id)

            return await ctx.db.habitCompletion.findMany({
                where: {
                    habitId: { in: habitIds },
                    completionDate: {
                        gte: input.startDate,
                        lte: input.endDate,
                    },
                },
                orderBy: { completionDate: 'asc' },
            })
        }),
    // Get stats for all active habits
    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const habits = await ctx.db.habit.findMany({
            where: { userId, isActive: true },
            include: {
                completions: {
                    orderBy: { completionDate: 'desc' },
                    // Remove take limit to ensure correct streak calculation for long-term habits
                    // take: 60  <-- This was causing the bug for streaks > 60 days

                }
            }
        })

        // Batch query for total completions (instead of N+1 queries)
        const habitIds = habits.map(h => h.id)
        const totalCompletionsCounts = await ctx.db.habitCompletion.groupBy({
            by: ['habitId'],
            where: {
                habitId: { in: habitIds },
                status: 'completed'
            },
            _count: { id: true }
        })

        // Create a map for quick lookup
        const completionsMap = new Map<string, number>()
        for (const item of totalCompletionsCounts) {
            completionsMap.set(item.habitId, item._count.id)
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStr = today.toISOString().split('T')[0]

        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const stats: Record<string, { streak: number, totalCompletions: number }> = {}

        for (const habit of habits) {
            let streak = 0
            let currentCheckDate = new Date(today)

            // Calculate streak
            // IMPORTANT: Only count completions with status 'completed' (not 'skipped' or 'failed')
            const completionsSet = new Set(
                habit.completions
                    .filter(c => c.status === 'completed')
                    .map(c => c.completionDate.toISOString().split('T')[0])
            )

            // If not completed today, start check from yesterday
            if (!completionsSet.has(todayStr)) {
                currentCheckDate = yesterday
            }

            while (true) {
                const dateStr = currentCheckDate.toISOString().split('T')[0]
                if (completionsSet.has(dateStr)) {
                    streak++
                    currentCheckDate.setDate(currentCheckDate.getDate() - 1)
                } else {
                    break
                }
            }

            stats[habit.id] = {
                streak,
                totalCompletions: completionsMap.get(habit.id) || 0
            }
        }

        return stats
    })
})
