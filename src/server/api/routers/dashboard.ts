import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
    getOverview: protectedProcedure
        .input(
            z.object({
                date: z.date().optional(), // For "today" queries
                year: z.number().optional(), // For calendar
                month: z.number().optional(), // For calendar
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const today = input.date || new Date()
            const todayStart = new Date(today)
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date(today)
            todayEnd.setHours(23, 59, 59, 999)

            // Calculate month range for events
            const year = input.year || today.getFullYear()
            const month = input.month || (today.getMonth() + 1)
            const monthStart = new Date(year, month - 1, 1)
            const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

            const [habits, completions, tasks, events, goals] = await Promise.all([
                // 1. Get Active Habits
                ctx.db.habit.findMany({
                    where: { userId, isActive: true },
                    orderBy: { createdAt: 'desc' },
                }),
                // 2. Get Today's Completions (using relation filtering)
                ctx.db.habitCompletion.findMany({
                    where: {
                        habit: { userId },
                        completionDate: {
                            gte: todayStart,
                            lte: todayEnd,
                        },
                    },
                    orderBy: { completionDate: 'asc' },
                }),
                // 3. Get Today's Tasks
                ctx.db.task.findMany({
                    where: {
                        userId,
                        dueDate: {
                            gte: todayStart,
                            lte: todayEnd,
                        },
                    },
                    orderBy: [{ status: 'asc' }, { priority: 'desc' }],
                }),
                // 4. Get Month's Events
                ctx.db.event.findMany({
                    where: {
                        userId,
                        startTime: {
                            gte: monthStart,
                            lte: monthEnd,
                        },
                    },
                    orderBy: { startTime: 'asc' },
                }),
                // 5. Get Active Goals
                ctx.db.goal.findMany({
                    where: { userId, status: 'active' },
                    include: {
                        milestones: {
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ])

            return {
                habits,
                completions,
                tasks,
                events,
                goals,
            }
        }),
});
