import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { startOfDay, endOfDay } from 'date-fns'

export const taskRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(
            z.object({
                status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
                dueDate: z.date().optional(),
                priority: z.enum(['low', 'medium', 'high']).optional(),
                category: z.string().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const where: any = { userId }

            if (input.status) where.status = input.status
            if (input.dueDate) where.dueDate = input.dueDate
            if (input.priority) where.priority = input.priority
            if (input.category) where.category = input.category

            return await ctx.db.task.findMany({
                where,
                orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
            })
        }),

    getToday: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const today = new Date()

        return await ctx.db.task.findMany({
            where: {
                userId,
                dueDate: {
                    gte: startOfDay(today),
                    lte: endOfDay(today),
                },
            },
            orderBy: [{ status: 'asc' }, { priority: 'desc' }],
        })
    }),

    getOverdue: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const today = startOfDay(new Date())

        return await ctx.db.task.findMany({
            where: {
                userId,
                dueDate: {
                    lt: today,
                },
                status: {
                    in: ['pending', 'in_progress'],
                },
            },
            orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
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

            return await ctx.db.task.findMany({
                where: {
                    userId,
                    dueDate: {
                        gte: startOfDay(input.startDate),
                        lte: endOfDay(input.endDate),
                    },
                },
                orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
            })
        }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const today = new Date()

        const [total, pending, completed, overdue, todayTasks] = await Promise.all([
            ctx.db.task.count({ where: { userId } }),
            ctx.db.task.count({ where: { userId, status: 'pending' } }),
            ctx.db.task.count({ where: { userId, status: 'completed' } }),
            ctx.db.task.count({
                where: {
                    userId,
                    dueDate: { lt: startOfDay(today) },
                    status: { in: ['pending', 'in_progress'] },
                },
            }),
            ctx.db.task.count({
                where: {
                    userId,
                    dueDate: {
                        gte: startOfDay(today),
                        lte: endOfDay(today),
                    },
                },
            }),
        ])

        return { total, pending, completed, overdue, todayTasks }
    }),

    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                dueDate: z.date().optional(),
                priority: z.enum(['low', 'medium', 'high']).default('medium'),
                category: z.string().optional(),
                isRecurring: z.boolean().optional(),
                recurringPattern: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            return await ctx.db.task.create({
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
                title: z.string().optional(),
                description: z.string().optional().nullable(),
                dueDate: z.date().optional().nullable(),
                status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
                priority: z.enum(['low', 'medium', 'high']).optional(),
                category: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { id, ...data } = input

            // Verify ownership
            const task = await ctx.db.task.findFirst({
                where: { id, userId },
            })
            if (!task) {
                throw new Error('Task not found')
            }

            const updateData: any = { ...data }

            if (data.status === 'completed') {
                updateData.completedAt = new Date()
            } else if (data.status) {
                updateData.completedAt = null
            }

            return await ctx.db.task.update({
                where: { id },
                data: updateData,
            })
        }),

    toggleComplete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership
            const task = await ctx.db.task.findFirst({
                where: { id: input.id, userId },
            })

            if (!task) throw new Error('Task not found')

            const isCompleted = task.status === 'completed'
            return await ctx.db.task.update({
                where: { id: input.id },
                data: {
                    status: isCompleted ? 'pending' : 'completed',
                    completedAt: isCompleted ? null : new Date(),
                },
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership
            const task = await ctx.db.task.findFirst({
                where: { id: input.id, userId },
            })
            if (!task) {
                throw new Error('Task not found')
            }

            return await ctx.db.task.delete({
                where: { id: input.id },
            })
        }),
})

