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
                    take: 30 // Get last 30 completions to calculate current streak
                }
            }
        })

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const stats: Record<string, { streak: number, totalCompletions: number }> = {}

        for (const habit of habits) {
            let streak = 0
            let currentCheckDate = new Date(today)

            // Calculate streak
            // Check if completed today or yesterday to equal "active streak"
            const completionsSet = new Set(
                habit.completions.map(c => c.completionDate.toISOString().split('T')[0])
            )

            // If not completed today, start check from yesterday
            if (!completionsSet.has(today.toISOString().split('T')[0])) {
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

            // Get total completions count (aggregate query would be improved, but this roughly works with included data or separate count)
            const total = await ctx.db.habitCompletion.count({
                where: { habitId: habit.id, status: 'completed' }
            })

            stats[habit.id] = {
                streak,
                totalCompletions: total
            }
        }

        return stats
    })
})
