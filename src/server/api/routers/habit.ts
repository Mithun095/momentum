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
            const { id, ...data } = input
            return await ctx.db.habit.update({
                where: { id },
                data,
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
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
})
