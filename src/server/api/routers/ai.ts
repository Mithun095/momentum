import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { TRPCError } from '@trpc/server'
import { generateAiResponse, isAiAvailable, type AiMessage } from '@/lib/gemini'
import { startOfDay, subDays } from 'date-fns'

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

    // Send message and get AI response
    sendMessage: protectedProcedure
        .input(z.object({
            conversationId: z.string(),
            content: z.string().min(1).max(5000)
        }))
        .mutation(async ({ ctx, input }) => {
            // Verify conversation belongs to user
            const conversation = await ctx.db.aiConversation.findFirst({
                where: {
                    id: input.conversationId,
                    userId: ctx.session.user.id
                },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        take: 20 // Last 20 messages for context
                    }
                }
            })

            if (!conversation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' })
            }

            // Check if AI is available
            if (!isAiAvailable()) {
                throw new TRPCError({
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'AI service is not configured'
                })
            }

            // Get user context for better responses
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

            // Get recent mood from journal
            const recentJournal = await ctx.db.journalEntry.findFirst({
                where: { userId: ctx.session.user.id },
                orderBy: { entryDate: 'desc' },
                select: { mood: true }
            })

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
                // Generate AI response
                const aiResponseContent = await generateAiResponse(aiMessages, {
                    todayHabitsCompleted: habits,
                    totalHabits,
                    pendingTasks: tasks,
                    recentMood: recentJournal?.mood || undefined
                })

                // Save AI response
                const assistantMessage = await ctx.db.aiMessage.create({
                    data: {
                        conversationId: input.conversationId,
                        role: 'assistant',
                        content: aiResponseContent
                    }
                })

                // Update conversation title if it's new
                if (conversation.title === 'New conversation') {
                    // Generate a title from the first message
                    const title = input.content.slice(0, 50) + (input.content.length > 50 ? '...' : '')
                    await ctx.db.aiConversation.update({
                        where: { id: input.conversationId },
                        data: { title }
                    })
                } else {
                    // Just update the timestamp
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
