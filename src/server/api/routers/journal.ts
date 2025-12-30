import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'

export const journalRouter = createTRPCRouter({
    getAll: protectedProcedure
        .input(
            z.object({
                startDate: z.date().optional(),
                endDate: z.date().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const where: any = { userId }

            if (input.startDate || input.endDate) {
                where.entryDate = {}
                if (input.startDate) where.entryDate.gte = input.startDate
                if (input.endDate) where.entryDate.lte = input.endDate
            }

            return await ctx.db.journalEntry.findMany({
                where,
                include: { sections: true },
                orderBy: { entryDate: 'desc' },
            })
        }),

    getByDate: protectedProcedure
        .input(z.object({ date: z.date() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            return await ctx.db.journalEntry.findUnique({
                where: {
                    userId_entryDate: {
                        userId,
                        entryDate: input.date,
                    },
                },
                include: { sections: true },
            })
        }),

    create: protectedProcedure
        .input(
            z.object({
                entryDate: z.date(),
                mainContent: z.string(),
                voiceTranscript: z.string().optional(),
                mood: z.string().optional(),
                sections: z
                    .array(
                        z.object({
                            sectionType: z.enum(['mistakes', 'good_things', 'planner']),
                            content: z.string(),
                        })
                    )
                    .optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id
            const { sections, ...entryData } = input

            const entry = await ctx.db.journalEntry.create({
                data: {
                    ...entryData,
                    userId,
                    sections: sections
                        ? {
                            create: sections,
                        }
                        : undefined,
                },
                include: { sections: true },
            })

            // If there's a planner section, create tasks for tomorrow
            const plannerSection = sections?.find((s) => s.sectionType === 'planner')
            if (plannerSection) {
                const tomorrow = new Date(input.entryDate)
                tomorrow.setDate(tomorrow.getDate() + 1)

                // Simple parsing: split by newlines
                const tasks = plannerSection.content.split('\n').filter((t) => t.trim())

                await Promise.all(
                    tasks.map((taskTitle) =>
                        ctx.db.task.create({
                            data: {
                                userId,
                                title: taskTitle.trim(),
                                dueDate: tomorrow,
                                fromPlannerId: entry.id,
                            },
                        })
                    )
                )
            }

            return entry
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                mainContent: z.string().optional(),
                mood: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { id, ...data } = input
            return await ctx.db.journalEntry.update({
                where: { id },
                data,
            })
        }),
})
