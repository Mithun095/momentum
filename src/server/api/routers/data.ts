import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const dataRouter = createTRPCRouter({
    // Export all user data
    exportAll: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const [habits, habitCompletions, tasks, journalEntries, goals, events] = await Promise.all([
            ctx.db.habit.findMany({
                where: { userId },
                include: { completions: true },
            }),
            ctx.db.habitCompletion.findMany({
                where: { habit: { userId } },
            }),
            ctx.db.task.findMany({ where: { userId } }),
            ctx.db.journalEntry.findMany({
                where: { userId },
                include: { sections: true, attachments: true },
            }),
            ctx.db.goal.findMany({
                where: { userId },
                include: { milestones: true },
            }),
            ctx.db.event.findMany({ where: { userId } }),
        ])

        return {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            data: {
                habits,
                habitCompletions,
                tasks,
                journalEntries,
                goals,
                events,
            },
        }
    }),

    // Export specific data types
    exportHabits: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const habits = await ctx.db.habit.findMany({
            where: { userId },
            include: { completions: true },
        })

        return {
            exportedAt: new Date().toISOString(),
            type: 'habits',
            data: habits,
        }
    }),

    exportTasks: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const tasks = await ctx.db.task.findMany({ where: { userId } })

        return {
            exportedAt: new Date().toISOString(),
            type: 'tasks',
            data: tasks,
        }
    }),

    exportJournals: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const journals = await ctx.db.journalEntry.findMany({
            where: { userId },
            include: { sections: true },
        })

        return {
            exportedAt: new Date().toISOString(),
            type: 'journals',
            data: journals,
        }
    }),

    exportGoals: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const goals = await ctx.db.goal.findMany({
            where: { userId },
            include: { milestones: true },
        })

        return {
            exportedAt: new Date().toISOString(),
            type: 'goals',
            data: goals,
        }
    }),

    exportEvents: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const events = await ctx.db.event.findMany({ where: { userId } })

        return {
            exportedAt: new Date().toISOString(),
            type: 'events',
            data: events,
        }
    }),

    // Import data (with validation)
    importData: protectedProcedure
        .input(
            z.object({
                version: z.string(),
                data: z.object({
                    habits: z.array(z.object({
                        name: z.string(),
                        description: z.string().optional().nullable(),
                        category: z.string().optional().nullable(),
                        frequency: z.string().optional(),
                        color: z.string().optional().nullable(),
                        icon: z.string().optional().nullable(),
                    })).optional(),
                    tasks: z.array(z.object({
                        title: z.string(),
                        description: z.string().optional().nullable(),
                        dueDate: z.string().optional().nullable(),
                        priority: z.string().optional(),
                        status: z.string().optional(),
                        category: z.string().optional().nullable(),
                    })).optional(),
                    goals: z.array(z.object({
                        title: z.string(),
                        description: z.string().optional().nullable(),
                        category: z.string().optional().nullable(),
                        targetDate: z.string().optional().nullable(),
                        color: z.string().optional().nullable(),
                        milestones: z.array(z.object({
                            title: z.string(),
                        })).optional(),
                    })).optional(),
                    events: z.array(z.object({
                        title: z.string(),
                        description: z.string().optional().nullable(),
                        startTime: z.string(),
                        endTime: z.string(),
                        location: z.string().optional().nullable(),
                        isAllDay: z.boolean().optional(),
                        category: z.string().optional().nullable(),
                        color: z.string().optional().nullable(),
                    })).optional(),
                }),
                overwrite: z.boolean().default(false),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { data, overwrite } = input
            const results = {
                habits: 0,
                tasks: 0,
                goals: 0,
                events: 0,
            }

            // Import habits
            if (data.habits && data.habits.length > 0) {
                if (overwrite) {
                    await ctx.db.habit.deleteMany({ where: { userId } })
                }

                for (const habit of data.habits) {
                    await ctx.db.habit.create({
                        data: {
                            userId,
                            name: habit.name,
                            description: habit.description,
                            category: habit.category,
                            frequency: habit.frequency || 'daily',
                            color: habit.color,
                            icon: habit.icon,
                        },
                    })
                    results.habits++
                }
            }

            // Import tasks
            if (data.tasks && data.tasks.length > 0) {
                if (overwrite) {
                    await ctx.db.task.deleteMany({ where: { userId } })
                }

                for (const task of data.tasks) {
                    await ctx.db.task.create({
                        data: {
                            userId,
                            title: task.title,
                            description: task.description,
                            dueDate: task.dueDate ? new Date(task.dueDate) : null,
                            priority: task.priority || 'medium',
                            status: task.status || 'pending',
                            category: task.category,
                        },
                    })
                    results.tasks++
                }
            }

            // Import goals
            if (data.goals && data.goals.length > 0) {
                if (overwrite) {
                    await ctx.db.goal.deleteMany({ where: { userId } })
                }

                for (const goal of data.goals) {
                    const createdGoal = await ctx.db.goal.create({
                        data: {
                            userId,
                            title: goal.title,
                            description: goal.description,
                            category: goal.category,
                            targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
                            color: goal.color,
                        },
                    })

                    // Create milestones
                    if (goal.milestones && goal.milestones.length > 0) {
                        await ctx.db.goalMilestone.createMany({
                            data: goal.milestones.map((m, i) => ({
                                goalId: createdGoal.id,
                                title: m.title,
                                order: i,
                            })),
                        })
                    }
                    results.goals++
                }
            }

            // Import events
            if (data.events && data.events.length > 0) {
                if (overwrite) {
                    await ctx.db.event.deleteMany({ where: { userId } })
                }

                for (const event of data.events) {
                    await ctx.db.event.create({
                        data: {
                            userId,
                            title: event.title,
                            description: event.description,
                            startTime: new Date(event.startTime),
                            endTime: new Date(event.endTime),
                            location: event.location,
                            isAllDay: event.isAllDay || false,
                            category: event.category,
                            color: event.color,
                        },
                    })
                    results.events++
                }
            }

            return {
                success: true,
                imported: results,
            }
        }),

    // Get backup info
    getBackupInfo: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id

        const [habitCount, taskCount, journalCount, goalCount, eventCount] = await Promise.all([
            ctx.db.habit.count({ where: { userId } }),
            ctx.db.task.count({ where: { userId } }),
            ctx.db.journalEntry.count({ where: { userId } }),
            ctx.db.goal.count({ where: { userId } }),
            ctx.db.event.count({ where: { userId } }),
        ])

        return {
            counts: {
                habits: habitCount,
                tasks: taskCount,
                journals: journalCount,
                goals: goalCount,
                events: eventCount,
            },
            totalRecords: habitCount + taskCount + journalCount + goalCount + eventCount,
        }
    }),
})
