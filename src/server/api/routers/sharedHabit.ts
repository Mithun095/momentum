import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { startOfDay } from 'date-fns'

export const sharedHabitRouter = createTRPCRouter({
    // Get habits for a workspace
    getByWorkspace: protectedProcedure
        .input(z.object({ workspaceId: z.string() }))
        .query(async ({ ctx, input }) => {
            // Check membership
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this workspace' })
            }

            const habits = await ctx.db.sharedHabit.findMany({
                where: {
                    workspaceId: input.workspaceId,
                    isActive: true
                },
                include: {
                    completions: {
                        where: {
                            completionDate: startOfDay(new Date())
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })

            return habits
        }),

    // Create a shared habit
    create: protectedProcedure
        .input(z.object({
            workspaceId: z.string(),
            name: z.string().min(1).max(100),
            description: z.string().optional(),
            frequency: z.enum(['daily', 'weekly']).default('daily')
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if user is owner or admin
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized to create habits' })
            }

            const habit = await ctx.db.sharedHabit.create({
                data: {
                    workspaceId: input.workspaceId,
                    name: input.name,
                    description: input.description,
                    frequency: input.frequency
                }
            })

            return habit
        }),

    // Toggle habit completion for current user
    toggle: protectedProcedure
        .input(z.object({
            habitId: z.string(),
            date: z.date().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            const date = startOfDay(input.date || new Date())

            // Get the habit and check membership
            const habit = await ctx.db.sharedHabit.findUnique({
                where: { id: input.habitId },
                include: { workspace: true }
            })

            if (!habit) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Habit not found' })
            }

            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: habit.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership) {
                throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a member of this workspace' })
            }

            // Check existing completion
            const existing = await ctx.db.sharedHabitCompletion.findUnique({
                where: {
                    sharedHabitId_userId_completionDate: {
                        sharedHabitId: input.habitId,
                        userId: ctx.session.user.id,
                        completionDate: date
                    }
                }
            })

            if (existing) {
                // Remove completion
                await ctx.db.sharedHabitCompletion.delete({
                    where: { id: existing.id }
                })
                return { completed: false }
            } else {
                // Add completion
                await ctx.db.sharedHabitCompletion.create({
                    data: {
                        sharedHabitId: input.habitId,
                        userId: ctx.session.user.id,
                        completionDate: date,
                        status: 'completed'
                    }
                })
                return { completed: true }
            }
        }),

    // Get completions for a habit (all members)
    getCompletions: protectedProcedure
        .input(z.object({
            habitId: z.string(),
            startDate: z.date(),
            endDate: z.date()
        }))
        .query(async ({ ctx, input }) => {
            const habit = await ctx.db.sharedHabit.findUnique({
                where: { id: input.habitId }
            })

            if (!habit) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            // Check membership
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: habit.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership) {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            const completions = await ctx.db.sharedHabitCompletion.findMany({
                where: {
                    sharedHabitId: input.habitId,
                    completionDate: {
                        gte: startOfDay(input.startDate),
                        lte: startOfDay(input.endDate)
                    }
                },
                orderBy: { completionDate: 'desc' }
            })

            return completions
        }),

    // Get team stats for a workspace
    getStats: protectedProcedure
        .input(z.object({ workspaceId: z.string() }))
        .query(async ({ ctx, input }) => {
            // Check membership
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: input.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership) {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            const today = startOfDay(new Date())

            // Get workspace data
            const [habits, members, todayCompletions] = await Promise.all([
                ctx.db.sharedHabit.count({ where: { workspaceId: input.workspaceId, isActive: true } }),
                ctx.db.workspaceMember.count({ where: { workspaceId: input.workspaceId } }),
                ctx.db.sharedHabitCompletion.findMany({
                    where: {
                        sharedHabit: { workspaceId: input.workspaceId },
                        completionDate: today
                    },
                    include: { sharedHabit: true }
                })
            ])

            // Calculate today's completion rate
            const expectedCompletions = habits * members
            const actualCompletions = todayCompletions.length
            const todayRate = expectedCompletions > 0 ? (actualCompletions / expectedCompletions) * 100 : 0

            return {
                totalHabits: habits,
                memberCount: members,
                todayCompletions: actualCompletions,
                todayCompletionRate: Math.round(todayRate)
            }
        }),

    // Update habit
    update: protectedProcedure
        .input(z.object({
            id: z.string(),
            name: z.string().min(1).max(100).optional(),
            description: z.string().optional(),
            isActive: z.boolean().optional()
        }))
        .mutation(async ({ ctx, input }) => {
            const habit = await ctx.db.sharedHabit.findUnique({
                where: { id: input.id }
            })

            if (!habit) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            // Check if user is owner or admin
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: habit.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            const updated = await ctx.db.sharedHabit.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    description: input.description,
                    isActive: input.isActive
                }
            })

            return updated
        }),

    // Delete habit
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const habit = await ctx.db.sharedHabit.findUnique({
                where: { id: input.id }
            })

            if (!habit) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            // Check if user is owner or admin
            const membership = await ctx.db.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: habit.workspaceId,
                        userId: ctx.session.user.id
                    }
                }
            })

            if (!membership || !['owner', 'admin'].includes(membership.role)) {
                throw new TRPCError({ code: 'FORBIDDEN' })
            }

            await ctx.db.sharedHabit.delete({ where: { id: input.id } })

            return { success: true }
        })
})
