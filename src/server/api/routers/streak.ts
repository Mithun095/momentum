import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { startOfDay, isYesterday, isToday } from 'date-fns'

export const streakRouter = createTRPCRouter({
    // Get user's current streak
    getStreak: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: {
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            },
        })
        return {
            currentStreak: user?.currentStreak ?? 0,
            longestStreak: user?.longestStreak ?? 0,
            lastActiveDate: user?.lastActiveDate,
        }
    }),

    // Record user activity and update streak
    recordActivity: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id
        const now = new Date()
        const todayStart = startOfDay(now)

        const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: {
                currentStreak: true,
                longestStreak: true,
                lastActiveDate: true,
            },
        })

        if (!user) {
            throw new Error('User not found')
        }

        const lastActive = user.lastActiveDate
        let newStreak = user.currentStreak

        // Check if already active today
        if (lastActive && isToday(lastActive)) {
            // Already recorded today, no change
            return {
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                streakUpdated: false,
            }
        }

        // Calculate new streak
        if (!lastActive) {
            // First activity ever
            newStreak = 1
        } else if (isYesterday(lastActive)) {
            // Consecutive day - increment streak
            newStreak = user.currentStreak + 1
        } else {
            // Gap in activity - reset streak
            newStreak = 1
        }

        // Update longest streak if needed
        const newLongestStreak = Math.max(user.longestStreak, newStreak)

        // Update user
        await ctx.db.user.update({
            where: { id: userId },
            data: {
                currentStreak: newStreak,
                longestStreak: newLongestStreak,
                lastActiveDate: now,
            },
        })

        return {
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            streakUpdated: true,
        }
    }),
})
