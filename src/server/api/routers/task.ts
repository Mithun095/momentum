import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const taskRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(
            z.object({
                status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
                dueDate: z.date().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const where: any = { userId }

            if (input.status) where.status = input.status
            if (input.dueDate) where.dueDate = input.dueDate

            return await ctx.db.task.findMany({
                where,
                orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
            })
        }),

    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                dueDate: z.date().optional(),
                priority: z.enum(['low', 'medium', 'high']).default('medium'),
                category: z.string().optional(),
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
                description: z.string().optional(),
                status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
                priority: z.enum(['low', 'medium', 'high']).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input
            const updateData: any = { ...data }

            if (data.status === 'completed') {
                updateData.completedAt = new Date()
            }

            return await ctx.db.task.update({
                where: { id },
                data: updateData,
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return await ctx.db.task.delete({
                where: { id: input.id },
            })
        }),
})
