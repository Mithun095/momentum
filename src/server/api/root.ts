import { createTRPCRouter } from '@/server/api/trpc'
import { habitRouter } from './routers/habit'
import { journalRouter } from './routers/journal'
import { taskRouter } from './routers/task'

export const appRouter = createTRPCRouter({
    habit: habitRouter,
    journal: journalRouter,
    task: taskRouter,
})

export type AppRouter = typeof appRouter
