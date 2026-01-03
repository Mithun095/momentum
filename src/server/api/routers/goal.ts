import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const goalRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(
            z.object({
                status: z.enum(['active', 'completed', 'archived']).optional(),
                category: z.string().optional(),
            }).optional()
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const where: Record<string, unknown> = { userId }

            if (input?.status) where.status = input.status
            if (input?.category) where.category = input.category

            return await ctx.db.goal.findMany({
                where,
                include: {
                    milestones: {
                        orderBy: { order: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
            })
        }),

    getActive: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        return await ctx.db.goal.findMany({
            where: { userId, status: 'active' },
            include: {
                milestones: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        })
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            const goal = await ctx.db.goal.findFirst({
                where: { id: input.id, userId },
                include: {
                    milestones: {
                        orderBy: { order: 'asc' },
                    },
                },
            })

            if (!goal) {
                throw new Error('Goal not found')
            }

            return goal
        }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const [total, active, completed, archived] = await Promise.all([
            ctx.db.goal.count({ where: { userId } }),
            ctx.db.goal.count({ where: { userId, status: 'active' } }),
            ctx.db.goal.count({ where: { userId, status: 'completed' } }),
            ctx.db.goal.count({ where: { userId, status: 'archived' } }),
        ])

        // Get average progress of active goals
        const activeGoals = await ctx.db.goal.findMany({
            where: { userId, status: 'active' },
            select: { progress: true },
        })
        const avgProgress = activeGoals.length > 0
            ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length
            : 0

        return { total, active, completed, archived, avgProgress }
    }),

    create: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(200),
                description: z.string().optional(),
                category: z.string().optional(),
                targetDate: z.date().optional(),
                color: z.string().optional(),
                milestones: z.array(z.string()).optional(), // Initial milestone titles
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { milestones, ...goalData } = input

            const goal = await ctx.db.goal.create({
                data: {
                    ...goalData,
                    userId,
                },
            })

            // Create initial milestones if provided
            if (milestones && milestones.length > 0) {
                await ctx.db.goalMilestone.createMany({
                    data: milestones.map((title, index) => ({
                        goalId: goal.id,
                        title,
                        order: index,
                    })),
                })
            }

            return await ctx.db.goal.findFirst({
                where: { id: goal.id },
                include: { milestones: { orderBy: { order: 'asc' } } },
            })
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1).max(200).optional(),
                description: z.string().optional().nullable(),
                category: z.string().optional().nullable(),
                targetDate: z.date().optional().nullable(),
                status: z.enum(['active', 'completed', 'archived']).optional(),
                color: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { id, ...data } = input

            // Verify ownership
            const goal = await ctx.db.goal.findFirst({
                where: { id, userId },
            })
            if (!goal) {
                throw new Error('Goal not found')
            }

            return await ctx.db.goal.update({
                where: { id },
                data,
                include: { milestones: { orderBy: { order: 'asc' } } },
            })
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership
            const goal = await ctx.db.goal.findFirst({
                where: { id: input.id, userId },
            })
            if (!goal) {
                throw new Error('Goal not found')
            }

            return await ctx.db.goal.delete({
                where: { id: input.id },
            })
        }),

    // Milestone operations
    addMilestone: protectedProcedure
        .input(
            z.object({
                goalId: z.string(),
                title: z.string().min(1).max(200),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify goal ownership
            const goal = await ctx.db.goal.findFirst({
                where: { id: input.goalId, userId },
                include: { milestones: true },
            })
            if (!goal) {
                throw new Error('Goal not found')
            }

            // Get the next order
            const maxOrder = goal.milestones.length > 0
                ? Math.max(...goal.milestones.map(m => m.order))
                : -1

            const milestone = await ctx.db.goalMilestone.create({
                data: {
                    goalId: input.goalId,
                    title: input.title,
                    order: maxOrder + 1,
                },
            })

            // Recalculate progress
            await recalculateGoalProgress(ctx.db, input.goalId)

            return milestone
        }),

    updateMilestone: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                title: z.string().min(1).max(200).optional(),
                order: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { id, ...data } = input

            // Verify ownership through goal
            const milestone = await ctx.db.goalMilestone.findFirst({
                where: { id },
                include: { goal: true },
            })
            if (!milestone || milestone.goal.userId !== userId) {
                throw new Error('Milestone not found')
            }

            return await ctx.db.goalMilestone.update({
                where: { id },
                data,
            })
        }),

    toggleMilestone: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership through goal
            const milestone = await ctx.db.goalMilestone.findFirst({
                where: { id: input.id },
                include: { goal: true },
            })
            if (!milestone || milestone.goal.userId !== userId) {
                throw new Error('Milestone not found')
            }

            const updated = await ctx.db.goalMilestone.update({
                where: { id: input.id },
                data: {
                    isCompleted: !milestone.isCompleted,
                    completedAt: !milestone.isCompleted ? new Date() : null,
                },
            })

            // Recalculate goal progress
            await recalculateGoalProgress(ctx.db, milestone.goalId)

            return updated
        }),

    deleteMilestone: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify ownership through goal
            const milestone = await ctx.db.goalMilestone.findFirst({
                where: { id: input.id },
                include: { goal: true },
            })
            if (!milestone || milestone.goal.userId !== userId) {
                throw new Error('Milestone not found')
            }

            await ctx.db.goalMilestone.delete({
                where: { id: input.id },
            })

            // Recalculate goal progress
            await recalculateGoalProgress(ctx.db, milestone.goalId)

            return { success: true }
        }),
})

// Helper function to recalculate goal progress based on milestones
async function recalculateGoalProgress(db: typeof import('@/lib/db').db, goalId: string) {
    const milestones = await db.goalMilestone.findMany({
        where: { goalId },
    })

    if (milestones.length === 0) {
        await db.goal.update({
            where: { id: goalId },
            data: { progress: 0 },
        })
        return
    }

    const completedCount = milestones.filter(m => m.isCompleted).length
    const progress = (completedCount / milestones.length) * 100

    const updateData: { progress: number; status?: string } = { progress }

    // Auto-complete goal if all milestones are done
    if (progress === 100) {
        updateData.status = 'completed'
    }

    await db.goal.update({
        where: { id: goalId },
        data: updateData,
    })
}
