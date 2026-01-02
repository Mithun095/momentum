import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { generateAiResponse, isAiAvailable, type AiMessage } from '@/lib/gemini'
import { generateAiResponseWithStrategy } from '@/lib/ai/client'
import type { DbOperations, UserContext } from '@/lib/ai/agent'
import { startOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export const aiRouter = createTRPCRouter({
    // Check if AI is available
    isAvailable: protectedProcedure.query(() => {
        return { available: isAiAvailable() }
    }),

    // Debug Environment Variables (Temporary for debugging)
    debugEnv: protectedProcedure.query(() => {
        const key = process.env.GEMINI_API_KEY
        return {
            hasKey: !!key,
            keyLength: key?.length || 0,
            keyStart: key ? key.substring(0, 5) : 'null',
            isPlaceholder: key?.includes('AIzaSyB8UZays3rpuWZ5uE_wPvAXq258JlmXF0U'),
            nodeEnv: process.env.NODE_ENV
        }
    }),

    // Get all conversations for the user
    getConversations: protectedProcedure.query(async ({ ctx }) => {
        const conversations = await ctx.db.aiConversation.findMany({
            where: { userId: ctx.session.user.id },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        return conversations.map(c => ({
            id: c.id,
            title: c.title || 'New conversation',
            lastMessage: c.messages[0]?.content.slice(0, 100) || '',
            updatedAt: c.updatedAt
        }))
    }),

    // Get single conversation with messages
    getConversation: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const conversation = await ctx.db.aiConversation.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' }
                    }
                }
            })

            if (!conversation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
            }

            return conversation
        }),

    // Create new conversation
    createConversation: protectedProcedure
        .input(z.object({ title: z.string().optional() }))
        .mutation(async ({ ctx, input }) => {
            const conversation = await ctx.db.aiConversation.create({
                data: {
                    userId: ctx.session.user.id,
                    title: input.title || 'New conversation'
                }
            })

            return conversation
        }),

    // Send message with AI tools support
    sendMessageWithTools: protectedProcedure
        .input(z.object({
            conversationId: z.string(),
            content: z.string().min(1).max(5000)
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id

            // Verify conversation belongs to user
            const conversation = await ctx.db.aiConversation.findFirst({
                where: {
                    id: input.conversationId,
                    userId
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 20
                    }
                }
            })

            if (!conversation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
            }

            if (!isAiAvailable()) {
                throw new TRPCError({
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'AI service is not configured'
                })
            }

            // Get comprehensive user context
            const today = startOfDay(new Date())
            const weekStart = startOfWeek(today, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

            const [
                todayHabitCompletions,
                totalActiveHabits,
                pendingTasks,
                completedTasksToday,
                recentJournals,
                streakData
            ] = await Promise.all([
                ctx.db.habitCompletion.count({
                    where: {
                        habit: { userId, isActive: true },
                        completionDate: today,
                        status: 'completed'
                    }
                }),
                ctx.db.habit.count({
                    where: { userId, isActive: true }
                }),
                ctx.db.task.count({
                    where: {
                        userId,
                        status: { in: ['pending', 'in_progress'] }
                    }
                }),
                ctx.db.task.count({
                    where: {
                        userId,
                        status: 'completed',
                        completedAt: { gte: today }
                    }
                }),
                ctx.db.journalEntry.findMany({
                    where: { userId },
                    orderBy: { entryDate: 'desc' },
                    take: 7,
                    select: { entryDate: true, mood: true }
                }),
                calculateStreak(ctx.db, userId)
            ])

            const userContext: UserContext = {
                userId,
                userName: ctx.session.user.name || undefined,
                todayHabitsCompleted: todayHabitCompletions,
                totalActiveHabits,
                currentStreak: streakData,
                pendingTasks,
                completedTasksToday,
                recentMood: recentJournals[0]?.mood || undefined,
                recentMoods: recentJournals
                    .filter(j => j.mood)
                    .map(j => ({
                        date: j.entryDate.toISOString().split('T')[0],
                        mood: j.mood!
                    }))
            }

            // Create database operations for tool execution
            const dbOps: DbOperations = {
                createTask: async (uid, data) => {
                    const task = await ctx.db.task.create({
                        data: {
                            userId: uid,
                            title: data.title,
                            description: data.description,
                            dueDate: data.dueDate,
                            priority: (data.priority as 'low' | 'medium' | 'high') || 'medium',
                            category: data.category,
                            status: 'pending'
                        }
                    })
                    return { id: task.id }
                },
                createHabit: async (uid, data) => {
                    const habit = await ctx.db.habit.create({
                        data: {
                            userId: uid,
                            name: data.name,
                            description: data.description,
                            frequency: (data.frequency as 'daily' | 'weekly') || 'daily',
                            category: data.category,
                            isActive: true
                        }
                    })
                    return { id: habit.id }
                },
                getUserStats: async (uid, period) => {
                    let startDate: Date
                    const now = new Date()

                    switch (period) {
                        case 'today':
                            startDate = startOfDay(now)
                            break
                        case 'week':
                            startDate = startOfWeek(now, { weekStartsOn: 1 })
                            break
                        case 'month':
                            startDate = startOfMonth(now)
                            break
                    }

                    const [habitsCompleted, tasksCompleted, totalHabits, totalTasks] = await Promise.all([
                        ctx.db.habitCompletion.count({
                            where: {
                                habit: { userId: uid, isActive: true },
                                completionDate: { gte: startDate },
                                status: 'completed'
                            }
                        }),
                        ctx.db.task.count({
                            where: {
                                userId: uid,
                                status: 'completed',
                                completedAt: { gte: startDate }
                            }
                        }),
                        ctx.db.habit.count({ where: { userId: uid, isActive: true } }),
                        ctx.db.task.count({ where: { userId: uid } })
                    ])

                    return {
                        habitsCompleted,
                        tasksCompleted,
                        totalHabits,
                        totalTasks,
                        streakDays: streakData
                    }
                },
                getMoodData: async (uid, days) => {
                    const since = subDays(new Date(), days)
                    const journals = await ctx.db.journalEntry.findMany({
                        where: {
                            userId: uid,
                            entryDate: { gte: since },
                            mood: { not: null }
                        },
                        select: { entryDate: true, mood: true },
                        orderBy: { entryDate: 'asc' }
                    })

                    return {
                        moods: journals.map(j => ({
                            date: j.entryDate.toISOString().split('T')[0],
                            mood: j.mood!
                        }))
                    }
                }
            }

            // Save user message
            const userMessage = await ctx.db.aiMessage.create({
                data: {
                    conversationId: input.conversationId,
                    role: 'user',
                    content: input.content
                }
            })

            // Prepare messages for AI
            const aiMessages: AiMessage[] = [
                ...conversation.messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                })),
                { role: 'user' as const, content: input.content }
            ]

            try {
                // Generate AI response with tools (using fallback strategy)
                const aiResponse = await generateAiResponseWithStrategy(aiMessages, userContext, dbOps)

                // Save AI response with tool metadata
                const assistantMessage = await ctx.db.aiMessage.create({
                    data: {
                        conversationId: input.conversationId,
                        role: 'assistant',
                        content: aiResponse.text,
                        metadata: aiResponse.toolCalls ? JSON.stringify({ toolCalls: aiResponse.toolCalls }) : undefined
                    }
                })

                // Update conversation
                if (conversation.title === 'New conversation') {
                    const title = input.content.slice(0, 50) + (input.content.length > 50 ? '...' : '')
                    await ctx.db.aiConversation.update({
                        where: { id: input.conversationId },
                        data: { title }
                    })
                } else {
                    await ctx.db.aiConversation.update({
                        where: { id: input.conversationId },
                        data: { updatedAt: new Date() }
                    })
                }

                return {
                    userMessage,
                    assistantMessage,
                    toolCalls: aiResponse.toolCalls
                }
            } catch (error) {
                console.error('AI response error:', error)

                // Extract error message for user
                let errorMessage = 'Failed to generate AI response'
                if (error instanceof Error) {
                    errorMessage = error.message
                    // Log full stack for debugging
                    console.error('AI Error Stack:', error.stack)
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorMessage
                })
            }
        }),

    // Legacy send message (without tools)
    sendMessage: protectedProcedure
        .input(z.object({
            conversationId: z.string(),
            content: z.string().min(1).max(5000)
        }))
        .mutation(async ({ ctx, input }) => {
            const conversation = await ctx.db.aiConversation.findFirst({
                where: {
                    id: input.conversationId,
                    userId: ctx.session.user.id
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 20
                    }
                }
            })

            if (!conversation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
            }

            if (!isAiAvailable()) {
                throw new TRPCError({
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'AI service is not configured'
                })
            }

            const today = startOfDay(new Date())
            const [habits, tasks] = await Promise.all([
                ctx.db.habitCompletion.count({
                    where: {
                        habit: { userId: ctx.session.user.id },
                        completionDate: today
                    }
                }),
                ctx.db.task.count({
                    where: {
                        userId: ctx.session.user.id,
                        status: { in: ['pending', 'in_progress'] }
                    }
                })
            ])

            const totalHabits = await ctx.db.habit.count({
                where: {
                    userId: ctx.session.user.id,
                    isActive: true
                }
            })

            const recentJournal = await ctx.db.journalEntry.findFirst({
                where: { userId: ctx.session.user.id },
                orderBy: { entryDate: 'desc' },
                select: { mood: true }
            })

            const userMessage = await ctx.db.aiMessage.create({
                data: {
                    conversationId: input.conversationId,
                    role: 'user',
                    content: input.content
                }
            })

            const aiMessages: AiMessage[] = [
                ...conversation.messages.map(m => ({
                    role: m.role as 'user' | 'assistant',
                    content: m.content
                })),
                { role: 'user' as const, content: input.content }
            ]

            try {
                const aiResponseContent = await generateAiResponse(aiMessages, {
                    todayHabitsCompleted: habits,
                    totalHabits,
                    pendingTasks: tasks,
                    recentMood: recentJournal?.mood || undefined
                })

                const assistantMessage = await ctx.db.aiMessage.create({
                    data: {
                        conversationId: input.conversationId,
                        role: 'assistant',
                        content: aiResponseContent
                    }
                })

                if (conversation.title === 'New conversation') {
                    const title = input.content.slice(0, 50) + (input.content.length > 50 ? '...' : '')
                    await ctx.db.aiConversation.update({
                        where: { id: input.conversationId },
                        data: { title }
                    })
                } else {
                    await ctx.db.aiConversation.update({
                        where: { id: input.conversationId },
                        data: { updatedAt: new Date() }
                    })
                }

                return {
                    userMessage,
                    assistantMessage
                }
            } catch (error) {
                console.error('AI response error:', error)
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to generate AI response'
                })
            }
        }),

    // Delete conversation
    deleteConversation: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const conversation = await ctx.db.aiConversation.findFirst({
                where: {
                    id: input.id,
                    userId: ctx.session.user.id
                }
            })

            if (!conversation) {
                throw new TRPCError({ code: 'NOT_FOUND' })
            }

            await ctx.db.aiConversation.delete({
                where: { id: input.id }
            })

            return { success: true }
        })
})

// Helper to calculate current streak
async function calculateStreak(db: any, userId: string): Promise<number> {
    const completions = await db.habitCompletion.findMany({
        where: {
            habit: { userId, isActive: true },
            status: 'completed'
        },
        select: { completionDate: true },
        orderBy: { completionDate: 'desc' }
    })

    if (completions.length === 0) return 0

    const dates = [...new Set(completions.map((c: { completionDate: Date }) =>
        c.completionDate.toISOString().split('T')[0]
    ))].sort().reverse()

    // Check if today or yesterday has completions
    const today = new Date().toISOString().split('T')[0]
    const yesterday = subDays(new Date(), 1).toISOString().split('T')[0]

    if (dates[0] !== today && dates[0] !== yesterday) {
        return 0
    }

    let streak = 1
    for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1] as string)
        const currDate = new Date(dates[i] as string)
        const diffDays = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) {
            streak++
        } else {
            break
        }
    }

    return streak
}
