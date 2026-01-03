import { createTRPCRouter } from '@/server/api/trpc'
import { habitRouter } from './routers/habit'
import { journalRouter } from './routers/journal'
import { taskRouter } from './routers/task'
import { workspaceRouter } from './routers/workspace'
import { sharedHabitRouter } from './routers/sharedHabit'
import { aiRouter } from './routers/ai'
import { dashboardRouter } from './routers/dashboard'
import { analyticsRouter } from './routers/analytics'
import { eventRouter } from './routers/event'
import { goalRouter } from './routers/goal'
import { dataRouter } from './routers/data'

export const appRouter = createTRPCRouter({
    habit: habitRouter,
    journal: journalRouter,
    task: taskRouter,
    workspace: workspaceRouter,
    sharedHabit: sharedHabitRouter,
    ai: aiRouter,
    analytics: analyticsRouter,
    dashboard: dashboardRouter,
    event: eventRouter,
    goal: goalRouter,
    data: dataRouter,
})

export type AppRouter = typeof appRouter
