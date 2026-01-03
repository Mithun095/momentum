import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays } from 'date-fns'

export const eventRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(
            z.object({
                category: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const where: Record<string, unknown> = { userId }

            if (input?.category) where.category = input.category

            return await ctx.db.event.findMany({
                where,
                orderBy: { startTime: 'asc' },
            })
        }),

    getByDateRange: protectedProcedure
        .input(
            z.object({
                startDate: z.date(),
                endDate: z.date(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            return await ctx.db.event.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: startOfDay(input.startDate),
                        lte: endOfDay(input.endDate),
                    },
                },
                orderBy: { startTime: 'asc' },
            })
        }),

    getByMonth: protectedProcedure
        .input(
            z.object({
                year: z.number(),
                month: z.number().min(0).max(11),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const date = new Date(input.year, input.month, 1)
            const start = startOfMonth(date)
            const end = endOfMonth(date)

            return await ctx.db.event.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: start,
                        lte: end,
                    },
                },
                orderBy: { startTime: 'asc' },
            })
        }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const today = new Date()

        return await ctx.db.event.findMany({
            where: {
                userId,
                startTime: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                },
            },
            orderBy: { startTime: 'asc' },
        })
    }),

    getUpcoming: protectedProcedure
        .input(
            z.object({
                days: z.number().default(7),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const today = new Date()
            const futureDate = addDays(today, input?.days ?? 7)

            return await ctx.db.event.findMany({
                where: {
                    userId,
                    startTime: {
                        gte: startOfDay(today),
                        lte: endOfDay(futureDate),
                    },
                },
                orderBy: { startTime: 'asc' },
            })
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            const event = await ctx.db.event.findFirst({
                where: { id: input.id, userId },
            })

            if (!event) {
                throw new Error('Event not found')
            }

            return event
        }),

    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                startTime: z.date(),
                endTime: z.date(),
                location: z.string().optional(),
                isAllDay: z.boolean().default(false),
                category: z.string().optional(),
                color: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Validate end time is after start time
            if (input.endTime <= input.startTime) {
                throw new Error('End time must be after start time')
            }

            return await ctx.db.event.create({
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
                title: z.string().min(1).max(200).optional(),
                description: z.string().optional().nullable(),
                startTime: z.date().optional(),
                endTime: z.date().optional(),
                location: z.string().optional().nullable(),
                isAllDay: z.boolean().optional(),
                category: z.string().optional().nullable(),
                color: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { id, ...data } = input

            // Verify ownership
            const event = await ctx.db.event.findFirst({
                where: { id, userId },
            })
            if (!event) {
                throw new Error('Event not found')
            }

            // Validate times if both are provided
            const startTime = data.startTime ?? event.startTime
            const endTime = data.endTime ?? event.endTime
            if (endTime <= startTime) {
                throw new Error('End time must be after start time')
            }

            return await ctx.db.event.update({
                where: { id },
                data,
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership
            const event = await ctx.db.event.findFirst({
                where: { id: input.id, userId },
            })
            if (!event) {
                throw new Error('Event not found')
            }

            return await ctx.db.event.delete({
                where: { id: input.id },
            })
        }),
})
