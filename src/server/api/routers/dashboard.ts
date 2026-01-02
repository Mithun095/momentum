import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
    getData: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Parallelize DB queries for maximum speed
        const [habits, tasks, taskStats, journalCount] = await Promise.all([
            // 1. Get Habits
            ctx.db.habit.findMany({
                where: { userId },
                include: { completions: true },
                orderBy: { createdAt: "desc" },
            }),
            // 2. Get Today's Tasks
            ctx.db.task.findMany({
                where: {
                    userId,
                    status: { not: "completed" },
                    dueDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lte: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                },
                orderBy: { priority: "desc" },
            }),
            // 3. Get Task Stats
            ctx.db.task.groupBy({
                by: ["status"],
                where: { userId },
                _count: true,
            }).then(async (groups) => {
                const pending = groups.find((g) => g.status === "pending")?._count || 0;
                const completed = groups.find((g) => g.status === "completed")?._count || 0;

                // Separate overdue check
                const overdue = await ctx.db.task.count({
                    where: {
                        userId,
                        dueDate: { lt: new Date() },
                        status: "pending" // Correct status check for overdue
                    }
                });

                const todayCount = await ctx.db.task.count({
                    where: {
                        userId,
                        dueDate: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lte: new Date(new Date().setHours(23, 59, 59, 999)),
                        }
                    }
                });

                return { pending, completed, overdue, todayTasks: todayCount };
            }),
            // 4. Get Journal Stats
            ctx.db.journalEntry.count({
                where: { userId },
            }),
        ]);

        return {
            habits,
            todayTasks: tasks,
            taskStats,
            journalStats: { totalEntries: journalCount },
        };
    }),
});
