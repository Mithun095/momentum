import { createTRPCRouter } from '@/server/api/trpc'
import { habitRouter } from './routers/habit'
import { journalRouter } from './routers/journal'
import { taskRouter } from './routers/task'
import { workspaceRouter } from './routers/workspace'
import { sharedHabitRouter } from './routers/sharedHabit'
import { aiRouter } from './routers/ai'

export const appRouter = createTRPCRouter({
    habit: habitRouter,
    journal: journalRouter,
    task: taskRouter,
    workspace: workspaceRouter,
    sharedHabit: sharedHabitRouter,
    ai: aiRouter,
})

export type AppRouter = typeof appRouter


